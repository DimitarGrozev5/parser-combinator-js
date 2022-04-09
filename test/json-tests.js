const { run, printResult } = require("../src/basic-parser");
const {
  jNull,
  jBool,
  jUnescapedChar,
  jEscapedChar,
  jUnicodeChar,
  jString,
  jNumber,
} = require("../src/json-parser/json-parser");
const {
  None,
  Some,
  Success,
  Failure,
  Parser,
  ParserPosition,
  InputState,
} = require("../src/types");
const {
  JString,
  JNumber,
  JBool,
  JNull,
  JObject,
  JArray,
} = require("../src/json-parser/json-types");
const { expect } = require("chai");
const { curry } = require("../src/helpers");

describe("Tests for json parser", () => {
  it("jNull works", () => {
    const result1 = run(jNull, "null");
    // Success: JNull
    expect(result1).to.be.instanceOf(Success);
    expect(result1.val[0]).to.be.instanceOf(JNull);

    const result2 = run(jNull, "nulp");
    // Line:0 Col:3 Error parsing null
    // nulp
    //    ^Unexpected 'p'
    expect(result2).to.be.instanceOf(Failure);
    expect(printResult(result2)).to.equal(
      "Line:0 Col:3 Error parsing null\nnulp\n   ^Unexpected 'p'"
    );
  });
  it("jBool works", () => {
    const result1 = run(jBool, "true");
    // Success: JBool true
    expect(result1).to.be.instanceOf(Success);
    expect(result1.val[0]).to.be.instanceOf(JBool);
    expect(result1.val[0].val).to.equal(true);

    const result2 = run(jBool, "false");
    // Success: JBool false
    expect(result2).to.be.instanceOf(Success);
    expect(result2.val[0]).to.be.instanceOf(JBool);
    expect(result2.val[0].val).to.equal(false);

    const result3 = run(jBool, "truX");
    // Line:0 Col:0 Error parsing bool
    // truX
    // ^Unexpected 't'
    expect(result3).to.be.instanceOf(Failure);
    expect(printResult(result3)).to.equal(
      "Line:0 Col:0 Error parsing bool\ntruX\n^Unexpected 't'"
    );
  });
  it("jUnescapedChar works", () => {
    const result1 = run(jUnescapedChar, "a").val[0];
    // Success 'a'
    expect(result1).to.equal("a");

    const result2 = printResult(run(jUnescapedChar, "\\"));
    expect(result2).to.equal(
      "Line:0 Col:0 Error parsing char\n\\\n^Unexpected '\\'"
    );
    // Line:0 Col:0 Error parsing char
    // \
    // ^Unexpected '\'
  });
  it("jEscapedChar works", () => {
    const result1 = run(jEscapedChar, "\\\\"); // Success '\\'
    const result2 = run(jEscapedChar, "\\t"); // Success '\009'

    expect(result1.val[0]).to.equal("\\");
    expect(result2.val[0]).to.equal("\t");

    const result3 = printResult(run(jEscapedChar, "a"));
    expect(result3).to.equal(
      "Line:0 Col:0 Error parsing escaped char\na\n^Unexpected 'a'"
    );
    // Line:0 Col:0 Error parsing escaped char
    // a
    // ^Unexpected 'a'
  });
  it("jUnicodeChar works", () => {
    const result = run(jUnicodeChar, "\\u263A"); //  Success ('☺')

    expect(result.val[0]).to.equal("☺");
  });
  it("jString works", () => {
    const result1 = run(jString, '""');
    // Success (JString "")
    expect(result1.val[0]).to.be.instanceOf(JString);
    expect(result1.val[0].val).to.equal("");

    const result2 = run(jString, '"a"');
    // Success (JString "a")
    expect(result2.val[0]).to.be.instanceOf(JString);
    expect(result2.val[0].val).to.equal("a");

    const result3 = run(jString, '"ab"');
    // Success (JString "ab")
    expect(result3.val[0]).to.be.instanceOf(JString);
    expect(result3.val[0].val).to.equal("ab");

    const result4 = run(jString, '"ab\\tde"');
    // Success (JString "ab\tde")
    expect(result4.val[0]).to.be.instanceOf(JString);
    expect(result4.val[0].val).to.equal("ab\tde");

    const result5 = run(jString, '"ab\\u263Ade"');
    // Success (JString "ab☺de")
    expect(result5.val[0]).to.be.instanceOf(JString);
    expect(result5.val[0].val).to.equal("ab☺de");
  });
  it("jNumber works", () => {
    const result1 = run(jNumber, "123"); // JNumber 123.0
    const result2 = run(jNumber, "-123"); // JNumber -123.0
    const result3 = run(jNumber, "123.4"); // JNumber 123.4

    expect(result1.val[0]).to.be.instanceOf(JNumber);
    expect(result1.val[0].val).to.equal(123);
    expect(result2.val[0]).to.be.instanceOf(JNumber);
    expect(result2.val[0].val).to.equal(-123);
    expect(result3.val[0]).to.be.instanceOf(JNumber);
    expect(result3.val[0].val).to.equal(123.4);
  });
});
