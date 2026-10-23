import { describe, expect, it } from "vitest";
import { explainProblem } from "./explain";
import type { InputFormatKind } from "./types";

const explain = (input: string, raw: string, format: InputFormatKind, forced: InputFormatKind | null = null) =>
  explainProblem({ input, raw, format: forced ?? format, forced });

const BACK_TO_AUTO = { label: "Back to Auto", format: null };

describe("forced format that does not match the content", () => {
  it("JSON read as cURL", () => {
    const p = explain('{"a":1}', "Not a curl command", "curl", "curl");
    expect(p.message).toBe("This looks like JSON, not a cURL command.");
    expect(p.actions).toEqual([{ label: "Read as JSON", format: "json" }, BACK_TO_AUTO]);
    expect(p.line).toBeNull();
  });

  it("cURL read as JSON", () => {
    const p = explain("curl https://example.com/api", "JSON Parse error: Unexpected identifier", "json", "json");
    expect(p.message).toBe("This looks like a cURL command, not JSON.");
    expect(p.actions).toEqual([{ label: "Read as cURL", format: "curl" }, BACK_TO_AUTO]);
  });

  it("YAML read as JSON", () => {
    const p = explain("name: formaty\nversion: 2", "x", "json", "json");
    expect(p.message).toBe("This looks like YAML, not JSON.");
    expect(p.actions[0]).toEqual({ label: "Read as YAML", format: "yaml" });
  });

  it("JSON read as XML", () => {
    const p = explain('{"a":1}', "No XML elements found", "xml", "xml");
    expect(p.message).toBe("This looks like JSON, not XML.");
  });

  it("does not claim a format that does not parse", () => {
    const p = explain('{"a":', "Not a curl command", "curl", "curl");
    expect(p.message).toBe("This does not start with curl. Start the command with curl and an address, or choose another format under Read as.");
    expect(p.actions).toEqual([BACK_TO_AUTO]);
  });
});

describe("JSON", () => {
  it("trailing comma", () => {
    const p = explain('{"a":1,}', "anything", "json");
    expect(p.message).toBe('Unexpected "}" at line 1, column 8. Remove the trailing comma.');
    expect(p.line).toBe(1);
    expect(p.actions).toEqual([]);
  });

  it("doubled comma", () => {
    expect(explain('{"a": 1,, "b": 2}', "x", "json").message).toBe('Unexpected "," at line 1, column 9. Remove the extra comma.');
    expect(explain("[1,,2]", "x", "json").message).toBe('Unexpected "," at line 1, column 4. Remove the extra comma.');
  });

  it("trailing comma in an array", () => {
    expect(explain("[1,2,]", "x", "json").message).toBe('Unexpected "]" at line 1, column 6. Remove the trailing comma.');
  });

  it("missing value after a colon", () => {
    expect(explain('{"a": }', "x", "json").message).toBe('Unexpected "}" at line 1, column 7. A value is missing after the colon.');
    expect(explain('{"a":,"b":1}', "x", "json").message).toBe('Unexpected "," at line 1, column 6. A value is missing after the colon.');
  });

  it("unquoted property name", () => {
    expect(explain("{a: 1}", "x", "json").message).toBe('Unexpected "a" at line 1, column 2. Property names must be in double quotes.');
  });

  it("missing comma on a later line", () => {
    const p = explain('{\n  "a": 1\n  "b": 2\n}', "anything", "json");
    expect(p.message).toBe("Unexpected double quote at line 3, column 3. A comma may be missing before it.");
    expect(p.line).toBe(3);
  });

  it("single quotes", () => {
    const p = explain("{'a':1}", "anything", "json");
    expect(p.message).toBe("Unexpected single quote at line 1, column 2. Property names and strings need double quotes.");
  });

  it("missing colon", () => {
    const p = explain('{"a" 1}', "anything", "json");
    expect(p.message).toBe('Unexpected "1" at line 1, column 6. A colon is missing after the property name.');
  });

  it("unfinished document", () => {
    const p = explain('{"a":[1,2', "Unexpected EOF", "json");
    expect(p.message).toBe("This JSON ends too soon. A closing bracket, brace or quote is missing.");
    expect(p.line).toBe(1);
  });

  it("extra content after the value", () => {
    const p = explain('{"a":1} x', "anything", "json");
    expect(p.message).toBe('Unexpected "x" at line 1, column 9. Nothing may follow the JSON value.');
  });

  it("text that is not any known format", () => {
    const p = explain("hello world", "anything", "json");
    expect(p.message).toBe("This does not look like JSON, XML, YAML, TOML, CSV or cURL. Paste data in one of these formats, or choose one under Read as.");
    expect(p.line).toBeNull();
    expect(p.actions).toEqual([]);
  });

  it("offers Back to Auto when JSON is forced and broken", () => {
    const p = explain('{"a":1,}', "anything", "json", "json");
    expect(p.message).toBe('Unexpected "}" at line 1, column 8. Remove the trailing comma.');
    expect(p.actions).toEqual([BACK_TO_AUTO]);
  });
});

describe("YAML", () => {
  it("bad indentation", () => {
    const p = explain("a:\n  b: 1\n c: 2", "bad indentation of a mapping entry (3:2)\n\n 1 | a:", "yaml");
    expect(p.message).toBe("Indentation is off at line 3, column 2. Use spaces and keep keys at the same level aligned.");
    expect(p.line).toBe(3);
  });

  it("unclosed bracket", () => {
    const p = explain("a: [1,2", "unexpected end of the stream within a flow collection (2:1)", "yaml");
    expect(p.message).toBe("A bracket or brace is not closed at line 2, column 1. Add the missing closing character.");
  });

  it("repeated key", () => {
    const p = explain("a: 1\na: 2", "duplicated mapping key (2:1)", "yaml");
    expect(p.message).toBe("A key is repeated at line 2, column 1. Each key can appear once per level.");
  });
});

describe("TOML", () => {
  it("key without value", () => {
    const p = explain("a = ", "Key without value at row 1, col 6, pos 5:\n> 1: a = ", "toml");
    expect(p.message).toBe("A key has no value at line 1, column 6. Write it as key = value.");
    expect(p.line).toBe(1);
  });

  it("key defined twice", () => {
    const p = explain("a = 1\na = 2", "Can't redefine existing key at row 2, col 6, pos 12:", "toml");
    expect(p.message).toBe("A key is defined twice at line 2, column 6. Remove or rename one of them.");
  });

  it("unterminated string", () => {
    const p = explain('a = "x', "Unterminated string at row 1, col 7, pos 6:", "toml");
    expect(p.message).toBe("A string is not closed at line 1, column 7. Add the closing quote.");
  });
});

describe("CSV", () => {
  it("too few values", () => {
    const p = explain("a,b,c\n1,2", "Too few fields: expected 3 fields but parsed 2 (line 2)", "csv");
    expect(p.message).toBe("Line 2 has 2 values but the header has 3. Add the missing values, or quote fields that contain commas.");
    expect(p.line).toBe(2);
  });

  it("too many values", () => {
    const p = explain("a,b\n1,2,3", "Too many fields: expected 2 fields but parsed 3 (line 2)", "csv");
    expect(p.message).toBe("Line 2 has 3 values but the header has 2. Quote any field that contains a comma.");
  });

  it("open quote", () => {
    const p = explain('a,b\n"1,2', "Quoted field unterminated (line 2)", "csv");
    expect(p.message).toBe("A quoted field is not closed at line 2. Add the closing quote.");
  });
});

describe("cURL", () => {
  it("no address", () => {
    const p = explain("curl -X POST", "Could not find URL in curl command", "curl");
    expect(p.message).toBe("No address found in this cURL command. Add a URL that starts with http:// or https://.");
  });
});

describe("running and converting", () => {
  it("network failure names the host", () => {
    const p = explain('curl "https://api.example.com/v1/users"', "Failed to fetch", "curl");
    expect(p.message).toBe(
      "Could not reach api.example.com. The server may be offline, the address may be wrong, or it may not allow requests from a browser (CORS).",
    );
  });

  it("network failure without a known host", () => {
    const p = explain("{}", "NetworkError when attempting to fetch resource.", "json");
    expect(p.message).toBe(
      "Could not reach the server. It may be offline, the address may be wrong, or it may not allow requests from a browser (CORS).",
    );
  });

  it("timeout", () => {
    const p = explain("curl https://slow.example.com", "Request timed out after 30 seconds", "curl");
    expect(p.message).toBe("The request took longer than 30 seconds and was stopped. Check the address, or try again.");
  });

  it("too large", () => {
    const p = explain("{}", "worker input is too large: 300000000 bytes exceeds cap of 209715200 bytes", "json");
    expect(p.message).toBe("This input is too large to process in the browser (limit 200 MB). Split it, or remove data you do not need.");
  });

  it("worker failure", () => {
    expect(explain("{}", "Worker crashed", "json").message).toBe(
      "The background worker stopped while working on this. Try again, and reload the page if it keeps happening.",
    );
    expect(explain("{}", "Worker failed", "json").message).toBe(
      "The background worker stopped while working on this. Try again, and reload the page if it keeps happening.",
    );
  });

  it("convert and operation failures", () => {
    expect(explain("{}", "Conversion failed", "json").message).toBe("Could not write this data in that output format. Try another output.");
    expect(explain("{}", "Operation failed.", "json").message).toBe("Could not finish that action on this input. Check the input, or try another output.");
  });

  it("schema problems", () => {
    expect(explain("{}", "Schema is required for Validate.", "json").message).toBe("Add a JSON Schema to validate against.");
    expect(explain("{}", "Invalid schema. Use JSON or YAML format.", "json").message).toBe(
      "That schema could not be read. Paste a JSON Schema as JSON or YAML.",
    );
  });

  it("unknown failure never shows the raw text", () => {
    const p = explain("a: 1", "TypeError: Cannot read properties of undefined (reading 'x')", "yaml");
    expect(p.message).toBe("Could not read this as YAML. Check the content, or choose another format under Read as.");
  });
});

describe("no message uses an em dash or an exclamation mark", () => {
  it("holds for a sample of problems", () => {
    const all = [
      explain('{"a":1,}', "x", "json").message,
      explain("hello", "x", "json").message,
      explain("a = ", "Key without value at row 1, col 6, pos 5:", "toml").message,
      explain("{}", "Worker crashed", "json").message,
    ];
    for (const m of all) expect(m).not.toMatch(/[—–!]/);
  });
});
