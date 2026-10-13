import { describe, expect, it } from "vitest";
import { guessLang, highlight, langForOutput, type HighlightLang, type Token } from "./highlight";

/** Non-plain tokens only, as [text, kind] pairs. */
const marks = (code: string, lang: HighlightLang) =>
  highlight(code, lang)
    .filter((t) => t.kind !== "plain")
    .map((t) => [t.text, t.kind]);

describe("highlight", () => {
  it("colours JSON keys, strings, numbers, literals and punctuation", () => {
    expect(marks('{"a": 1, "b": [true, null, "x"]}', "json")).toEqual([
      ["{", "punct"],
      ['"a"', "key"],
      [":", "punct"],
      ["1", "number"],
      [",", "punct"],
      ['"b"', "key"],
      [":", "punct"],
      ["[", "punct"],
      ["true", "keyword"],
      [",", "punct"],
      ["null", "keyword"],
      [",", "punct"],
      ['"x"', "string"],
      ["]}", "punct"],
    ]);
  });

  it("reads negative, decimal and exponent numbers as one token", () => {
    expect(marks("[-1.5e3]", "json")).toEqual([["[", "punct"], ["-1.5e3", "number"], ["]", "punct"]]);
  });

  it("keeps an escaped quote inside a JSON string", () => {
    expect(marks('"a\\"b"', "json")).toEqual([['"a\\"b"', "string"]]);
  });

  it("colours YAML keys, plain and quoted values, comments and list dashes", () => {
    expect(marks("name: Pod # kind\nitems:\n  - 3\n  - 'x'\nok: yes", "yaml")).toEqual([
      ["name", "key"],
      [":", "punct"],
      ["Pod", "string"],
      ["# kind", "comment"],
      ["items", "key"],
      [":", "punct"],
      ["-", "punct"],
      ["3", "number"],
      ["-", "punct"],
      ["'x'", "string"],
      ["ok", "key"],
      [":", "punct"],
      ["yes", "keyword"],
    ]);
  });

  it("colours XML tags, attributes, values, declarations and comments", () => {
    expect(marks('<?xml version="1.0"?><a id="1"><!-- c --><b/>t</a>', "xml")).toEqual([
      ['<?xml version="1.0"?>', "keyword"],
      ["<", "punct"],
      ["a", "key"],
      ["id", "number"],
      ["=", "punct"],
      ['"1"', "string"],
      [">", "punct"],
      ["<!-- c -->", "comment"],
      ["<", "punct"],
      ["b", "key"],
      ["/>", "punct"],
      ["</", "punct"],
      ["a", "key"],
      [">", "punct"],
    ]);
  });

  it("colours TOML tables, keys, strings, numbers and booleans", () => {
    expect(marks('[package]\nname = "formaty" # n\nn = 3\nok = true', "toml")).toEqual([
      ["[package]", "keyword"],
      ["name", "key"],
      ["=", "punct"],
      ['"formaty"', "string"],
      ["# n", "comment"],
      ["n", "key"],
      ["=", "punct"],
      ["3", "number"],
      ["ok", "key"],
      ["=", "punct"],
      ["true", "keyword"],
    ]);
  });

  it("colours the CSV header as keys and the rows by value type", () => {
    expect(marks('id,name\n1,"A, b"\n2,true', "csv")).toEqual([
      ["id", "key"],
      [",", "punct"],
      ["name", "key"],
      ["1", "number"],
      [",", "punct"],
      ['"A, b"', "string"],
      ["2", "number"],
      [",", "punct"],
      ["true", "keyword"],
    ]);
  });

  it("colours SQL keywords, types, identifiers, strings, numbers and comments", () => {
    expect(marks("-- t\nCREATE TABLE \"users\" (id INTEGER, n TEXT DEFAULT 'a''b', c NUMERIC(3,2));", "sql")).toEqual([
      ["-- t", "comment"],
      ["CREATE", "keyword"],
      ["TABLE", "keyword"],
      ['"users"', "key"],
      ["(", "punct"],
      ["INTEGER", "keyword"],
      [",", "punct"],
      ["TEXT", "keyword"],
      ["DEFAULT", "keyword"],
      ["'a''b'", "string"],
      [",", "punct"],
      ["NUMERIC", "keyword"],
      ["(", "punct"],
      ["3", "number"],
      [",", "punct"],
      ["2", "number"],
      ["));", "punct"],
    ]);
  });

  it("colours code keywords, type names, strings, numbers and comments", () => {
    expect(marks('export interface User { id: number; // pk\n name: "x" | 2 }', "code")).toEqual([
      ["export", "keyword"],
      ["interface", "keyword"],
      ["User", "keyword"],
      ["{", "punct"],
      [":", "punct"],
      ["number", "keyword"],
      [";", "punct"],
      ["// pk", "comment"],
      [":", "punct"],
      ['"x"', "string"],
      ["2", "number"],
      ["}", "punct"],
    ]);
  });

  it("colours a cURL command: command word, flags, strings", () => {
    expect(marks("curl -X POST 'https://a.b' --data \"{}\"", "bash")).toEqual([
      ["curl", "keyword"],
      ["-X", "number"],
      ["'https://a.b'", "string"],
      ["--data", "number"],
      ['"{}"', "string"],
    ]);
  });

  it("returns text unchanged for plain text and for very long input", () => {
    expect(highlight("a: 1", "text")).toEqual([{ text: "a: 1", kind: "plain" }]);
    const big = "1,".repeat(30000);
    expect(highlight(big, "csv")).toEqual([{ text: big, kind: "plain" }]);
  });

  it("never drops or reorders characters", () => {
    const samples: Array<[string, HighlightLang]> = [
      ['{\n  "a": [1, 2, {"b": null}],\n  "c": "d\\n"\n}', "json"],
      ["a:\n  - b: 'c'\n  - d # e\n", "yaml"],
      ['<r a="1">\n  <x>1 &amp; 2</x>\n</r>', "xml"],
      ['[[t]]\nk = [1, 2]\nd = 2020-01-02T03:04:05Z', "toml"],
      ['a,b\n"x""y",2\n', "csv"],
      ["SELECT * FROM t WHERE a IN (1, 'b') /* c */;", "sql"],
      ["func main() { fmt.Println(`hi`) }", "code"],
    ];
    for (const [code, lang] of samples) {
      const toks: Token[] = highlight(code, lang);
      expect(toks.map((t) => t.text).join(""), lang).toBe(code);
    }
  });
});

describe("langForOutput", () => {
  it("maps playground output ids to a highlight language", () => {
    expect(langForOutput("fmt:json")).toBe("json");
    expect(langForOutput("fmt:toml")).toBe("toml");
    expect(langForOutput("type:sql")).toBe("sql");
    expect(langForOutput("type:go")).toBe("code");
    expect(langForOutput("op:schema")).toBe("json");
    expect(langForOutput("op:minify")).toBe("json");
  });
});

describe("guessLang", () => {
  it("recognises JSON, cURL, XML and SQL, and falls back to text", () => {
    expect(guessLang('  {"a":1}')).toBe("json");
    expect(guessLang("[1]")).toBe("json");
    expect(guessLang("curl -X GET https://a.b")).toBe("bash");
    expect(guessLang("<?xml version='1.0'?><a/>")).toBe("xml");
    expect(guessLang("select * from t")).toBe("sql");
    expect(guessLang("id,name\n1,a")).toBe("text");
  });
});
