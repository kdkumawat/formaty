import { describe, expect, it } from "vitest";
import { xmlAdapter, xmlDeclarationOf } from "./xmlParser";
import { csvAdapter } from "./csvParser";
import { toCsv } from "@/lib/json/core";

const rt = (x: string) => xmlAdapter.stringify(xmlAdapter.parse(x), { xmlDeclaration: xmlDeclarationOf(x) });

describe("xml root handling", () => {
  it("uses a lone top-level key as the document element", () => {
    const out = xmlAdapter.stringify({ root: { id: 1, name: "test" } });
    expect(out.match(/<root>/g)).toHaveLength(1);
    expect(out).toContain("<id>1</id>");
  });
  it("wraps in root for 0, 2+ keys, arrays and primitives", () => {
    expect(xmlAdapter.stringify({ a: 1, b: 2 })).toMatch(/^<root>/);
    expect(xmlAdapter.stringify([1, 2])).toMatch(/^<root>/);
    expect(xmlAdapter.stringify({ a: [1, 2] })).toMatch(/^<root>/);
    expect(xmlAdapter.stringify(5)).toBe("<root>5</root>\n");
  });
  it("keeps the document element when parsing and drops the declaration", () => {
    expect(xmlAdapter.parse('<?xml version="1.0"?><root><id>1</id><name>test</name></root>')).toEqual({ root: { id: 1, name: "test" } });
    expect(xmlAdapter.parse("<users><user>a</user><user>b</user></users>")).toEqual({ users: { user: ["a", "b"] } });
    expect(xmlAdapter.parse("<a>1</a>")).toEqual({ a: 1 });
    expect(xmlAdapter.parse("<root><a>1</a></root>")).toEqual({ root: { a: 1 } });
  });
  it("round-trips XML -> XML keeping root name and declaration", () => {
    expect(rt("<root><a>1</a></root>")).toBe("<root>\n  <a>1</a>\n</root>\n");
    expect(rt("<users><user>a</user><user>b</user></users>")).toBe("<users>\n  <user>a</user>\n  <user>b</user>\n</users>\n");
    expect(rt("<a>1</a>")).toBe("<a>1</a>\n");
    expect(rt('﻿ <?xml version="1.0" encoding="UTF-8"?><root><a>1</a><b>2</b></root>')).toBe(
      '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n  <a>1</a>\n  <b>2</b>\n</root>\n',
    );
  });
  it("finds no declaration when absent", () => {
    expect(xmlDeclarationOf("<a/>")).toBeUndefined();
  });
});

describe("csv quoting and inference", () => {
  it("quotes minimally", () => {
    expect(toCsv([{ id: 1, name: "A" }, { id: 2, name: "B" }])).toBe("id,name\n1,A\n2,B");
    expect(toCsv([{ "a,b": 'x"y', c: " z", d: "l\nm", e: true }])).toBe('"a,b",c,d,e\n"x""y"," z","l\nm",true');
    expect(toCsv([{ a: "x;y" }], ";")).toBe('a\n"x;y"');
  });
  it("infers only lossless types", () => {
    const [row] = csvAdapter.parse("a,b,c,d,e,f,g,h,i\n1,-2.5,true,false,007,1e3,+1,1.50, 1") as Record<string, unknown>[];
    expect(row).toEqual({ a: 1, b: -2.5, c: true, d: false, e: "007", f: "1e3", g: "+1", h: "1.50", i: " 1" });
    expect(csvAdapter.parse("a,b\n,True\n")).toEqual([{ a: "", b: "True" }]);
  });
});
