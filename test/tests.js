const {
  printResult,
  setLabel,
  getLabel,
  pchar,
  run,
  andThen,
  orElse,
  choice,
  anyOf,
  mapP,
  returnP,
  applyP,
  lift2,
  sequence,
  pstring,
  many,
  many1,
  pint,
  opt,
  andThen1,
  andThen2,
  between,
  sepBy1,
  sepBy,
  bindP,
} = require("../src/basic-parser");
const { None, Some, Success, Failure, Parser } = require("../src/types");
const { expect } = require("chai");
const { curry } = require("../src/helpers");

describe("Tests for basic parsers", () => {
  it("pchar works", () => {
    const parseA = pchar("A");

    const result1 = run(parseA)("ABC");
    const result2 = run(parseA)("ZBC");
    const result3 = run(parseA)("");

    expect(result1).to.be.instanceOf(Success);
    expect(result1.val).to.eql(["A", "BC"]);

    expect(result2).to.be.instanceOf(Failure);
    expect(result2.val).to.eql(["A", "Unexpected 'Z'"]);

    expect(result3).to.be.instanceOf(Failure);
    expect(result3.val).to.eql(["A", "No more input"]);
  });
  it("andThen works", () => {
    const parseA = pchar("A");
    const parseB = pchar("B");
    const parseAThenB = andThen(parseA)(parseB);

    const result1 = run(parseAThenB)("ABC");
    const result2 = run(parseAThenB)("ZBC");
    const result3 = run(parseAThenB)("AZC");

    expect(result1).to.be.instanceOf(Success);
    expect(result1.val).to.eql([["A", "B"], "C"]);

    expect(result2).to.be.instanceOf(Failure);
    expect(result2.val).to.equal("Expecting 'A'. Got 'Z'");

    expect(result3).to.be.instanceOf(Failure);
    expect(result3.val).to.equal("Expecting 'B'. Got 'Z'");
  });
  it("orElse works", () => {
    const parseA = pchar("A");
    const parseB = pchar("B");
    const parseAOrElseB = orElse(parseA, parseB);

    const result1 = run(parseAOrElseB)("AZZ");
    const result2 = run(parseAOrElseB)("BZZ");
    const result3 = run(parseAOrElseB)("CZZ");

    expect(result1).to.be.instanceOf(Success);
    expect(result1.val).to.eql(["A", "ZZ"]);

    expect(result2).to.be.instanceOf(Success);
    expect(result2.val).to.eql(["B", "ZZ"]);

    expect(result3).to.be.instanceOf(Failure);
    expect(result3.val).to.equal("Expecting 'B'. Got 'C'");
  });
  it("choice works", () => {
    const parseA = pchar("A");
    const parseB = pchar("B");
    const parseC = pchar("C");
    const parseABOrC = choice([parseA, parseB, parseC]);

    const result1 = run(parseABOrC)("AZZ");
    const result2 = run(parseABOrC)("BZZ");
    const result3 = run(parseABOrC)("CZZ");
    const result4 = run(parseABOrC)("ZZZ");

    expect(result1).to.be.instanceOf(Success);
    expect(result1.val).to.eql(["A", "ZZ"]);

    expect(result2).to.be.instanceOf(Success);
    expect(result2.val).to.eql(["B", "ZZ"]);

    expect(result3).to.be.instanceOf(Success);
    expect(result3.val).to.eql(["C", "ZZ"]);

    expect(result4).to.be.instanceOf(Failure);
    expect(result4.val).to.equal("Expecting 'C'. Got 'Z'");
  });
  it("anyOf works", () => {
    const parceABOrC = anyOf(["A", "B", "C"]);

    const result1 = run(parceABOrC)("AZZ");
    const result2 = run(parceABOrC)("BZZ");
    const result3 = run(parceABOrC)("CZZ");
    const result4 = run(parceABOrC)("ZZZ");

    expect(result1).to.be.instanceOf(Success);
    expect(result1.val).to.eql(["A", "ZZ"]);

    expect(result2).to.be.instanceOf(Success);
    expect(result2.val).to.eql(["B", "ZZ"]);

    expect(result3).to.be.instanceOf(Success);
    expect(result3.val).to.eql(["C", "ZZ"]);

    expect(result4).to.be.instanceOf(Failure);
    expect(result4.val).to.equal("Expecting 'C'. Got 'Z'");
  });
  it("mapP works", () => {
    const parseDigit = anyOf(["1", "2", "3"]);

    // create a parser that returns a tuple
    const tupleParser = andThen(andThen(parseDigit, parseDigit), parseDigit);

    // create a function that turns the tuple into a string
    const transformTuple = ([[c1, c2], c3]) => "" + c1 + c2 + c3;

    // use "map" to combine them
    const parseThreeDigitsAsStr = mapP(transformTuple, tupleParser);

    const result1 = run(parseThreeDigitsAsStr, "123A");
    const result2 = run(parseThreeDigitsAsStr, "12AA");

    expect(result1).to.be.instanceOf(Success);
    expect(result1.val).to.eql(["123", "A"]);

    expect(result2).to.be.instanceOf(Failure);
    expect(result2.val).to.equal("Expecting '3'. Got 'A'");
  });
  it("returnP works", () => {
    const testParser = returnP("A");
    expect(testParser).to.be.instanceOf(Parser);

    const parseString = run(testParser, "BC");
    expect(parseString).to.be.instanceOf(Success);
    expect(parseString.val).to.eql(["A", "BC"]);
  });
  it("applyP works", () => {
    const add = (a) => a + 1;
    expect(add(1)).to.equal(2);

    const addP = returnP(add);
    const p1 = returnP(1);

    const result1 = applyP(addP, p1);
    expect(result1).to.be.instanceOf(Parser);

    const result2 = run(result1, "BC");
    expect(result2).to.be.instanceOf(Success);
    expect(result2.val).to.eql([2, "BC"]);
  });
  it("applyP works; take 2", () => {
    const add = (a) => a + 1;
    expect(add(1)).to.equal(2);

    const addP = returnP(add);
    const p1 = returnP(1);

    const addP1 = applyP(addP);
    const result1 = addP1(p1);
    expect(result1).to.be.instanceOf(Parser);

    const result2 = run(result1, "BC");
    expect(result2).to.be.instanceOf(Success);
    expect(result2.val).to.eql([2, "BC"]);
  });
  it("lift2 works", () => {
    const add = curry((a, b) => a + b);
    expect(add(2, 2)).to.equal(4);

    const liftedAdd = lift2(add);
    const result = liftedAdd(returnP(2), returnP(2));
    expect(result).to.be.instanceOf(Parser);

    const result1 = run(result, "BC");
    expect(result1).to.be.instanceOf(Success);
    expect(result1.val).to.eql([4, "BC"]);
  });
  it("sequence works", () => {
    const parsers = [pchar("A"), pchar("B"), pchar("C")];
    let combined = sequence(parsers);

    const result = run(combined, "ABCD");

    expect(result).to.be.instanceOf(Success);
    expect(result.val).to.eql([["A", "B", "C"], "D"]);
  });
  it("pstring works", () => {
    const parseABC = pstring("ABC");

    const result1 = run(parseABC, "ABCDE"); // Success ("ABC", "DE")
    const result2 = run(parseABC, "A|CDE"); // Failure "Expecting 'B'. Got '|'"
    const result3 = run(parseABC, "AB|DE"); // Failure "Expecting 'C'. Got '|'"

    expect(result1).to.be.instanceOf(Success);
    expect(result1.val).to.eql(["ABC", "DE"]);

    expect(result2).to.be.instanceOf(Failure);
    expect(result2.val).to.equal("Expecting 'B'. Got '|'");

    expect(result3).to.be.instanceOf(Failure);
    expect(result3.val).to.equal("Expecting 'C'. Got '|'");
  });
  it("many works", () => {
    const manyA = many(pchar("A"));

    // test some success cases
    const result1 = run(manyA, "ABCD"); // Success (['A'], "BCD")
    const result2 = run(manyA, "AACD"); // Success (['A'; 'A'], "CD")
    const result3 = run(manyA, "AAAD"); // Success (['A'; 'A'; 'A'], "D")

    // test a case with no matches
    const result4 = run(manyA, "|BCD"); // Success ([], "|BCD")

    expect(result1).to.be.instanceOf(Success);
    expect(result1.val).to.eql([["A"], "BCD"]);

    expect(result2).to.be.instanceOf(Success);
    expect(result2.val).to.eql([["A", "A"], "CD"]);

    expect(result3).to.be.instanceOf(Success);
    expect(result3.val).to.eql([["A", "A", "A"], "D"]);

    expect(result4).to.be.instanceOf(Success);
    expect(result4.val).to.eql([[], "|BCD"]);
  });
  it("many works; take 2", () => {
    const manyAB = many(pstring("AB"));

    const result1 = run(manyAB, "ABCD"); // Success (["AB"], "CD")
    const result2 = run(manyAB, "ABABCD"); // Success (["AB"; "AB"], "CD")
    const result3 = run(manyAB, "ZCD"); // Success ([], "ZCD")
    const result4 = run(manyAB, "AZCD"); // Success ([], "AZCD")

    expect(result1).to.be.instanceOf(Success);
    expect(result1.val).to.eql([["AB"], "CD"]);

    expect(result2).to.be.instanceOf(Success);
    expect(result2.val).to.eql([["AB", "AB"], "CD"]);

    expect(result3).to.be.instanceOf(Success);
    expect(result3.val).to.eql([[], "ZCD"]);

    expect(result4).to.be.instanceOf(Success);
    expect(result4.val).to.eql([[], "AZCD"]);
  });
  it("many1 works", () => {
    // define parser for one digit
    const digit = anyOf(["1", "2", "3", "4"]);

    // define parser for one or more digits
    const digits = many1(digit);

    const result1 = run(digits, "1ABC"); // Success (['1'], "ABC")
    const result2 = run(digits, "12BC"); // Success (['1'; '2'], "BC")
    const result3 = run(digits, "123C"); // Success (['1'; '2'; '3'], "C")
    const result4 = run(digits, "1234"); // Success (['1'; '2'; '3'; '4'], "")

    const result5 = run(digits, "ABC"); // Failure "Expecting '9'. Got 'A'"

    expect(result1).to.be.instanceOf(Success);
    expect(result1.val).to.eql([["1"], "ABC"]);

    expect(result2).to.be.instanceOf(Success);
    expect(result2.val).to.eql([["1", "2"], "BC"]);

    expect(result3).to.be.instanceOf(Success);
    expect(result3.val).to.eql([["1", "2", "3"], "C"]);

    expect(result4).to.be.instanceOf(Success);
    expect(result4.val).to.eql([["1", "2", "3", "4"], ""]);

    expect(result5).to.be.instanceOf(Failure);
    expect(result5.val).to.eql("Expecting '4'. Got 'A'");
  });
  it("pint works", () => {
    const result1 = run(pint, "1ABC"); // Success (1, "ABC")
    const result2 = run(pint, "12BC"); // Success (12, "BC")
    const result3 = run(pint, "123C"); // Success (123, "C")
    const result4 = run(pint, "1234"); // Success (1234, "")
    const result5 = run(pint, "ABC"); // Failure "Expecting '9'. Got 'A'"

    const result6 = run(pint, "-123C"); // Success (123, "C")

    expect(result1).to.be.instanceOf(Success);
    expect(result1.val).to.eql([1, "ABC"]);

    expect(result2).to.be.instanceOf(Success);
    expect(result2.val).to.eql([12, "BC"]);

    expect(result3).to.be.instanceOf(Success);
    expect(result3.val).to.eql([123, "C"]);

    expect(result4).to.be.instanceOf(Success);
    expect(result4.val).to.eql([1234, ""]);

    expect(result5).to.be.instanceOf(Failure);
    expect(result5.val).to.eql("Expecting '9'. Got 'A'");

    expect(result6).to.be.instanceOf(Success);
    expect(result6.val).to.eql([-123, "C"]);
  });
  it("opt works", () => {
    const digit = anyOf(["1"]);
    const digitThenSemicolon = andThen(digit, opt(pchar(";")));

    const result1 = run(digitThenSemicolon, "1;"); // Success (('1', Some ';'), "")
    const result2 = run(digitThenSemicolon, "1"); // Success (('1', None), "")

    expect(result1).to.be.instanceOf(Success);
    const [[res1, op1], rem1] = result1.val;
    expect(res1).to.equal("1");
    expect(op1).to.be.instanceOf(Some);
    expect(op1.val).to.equal(";");
    expect(rem1).to.equal("");

    expect(result2).to.be.instanceOf(Success);
    const [[res2, op2], rem2] = result2.val;
    expect(res2).to.equal("1");
    expect(op2).to.be.instanceOf(None);
    expect(rem2).to.equal("");
  });
  it("andThen1 works", () => {
    const digit = anyOf(["1"]);

    // use .>> below
    let digitThenSemicolon = andThen1(digit, opt(pchar(";")));

    const result1 = run(digitThenSemicolon, "1;"); // Success ('1', "")
    const result2 = run(digitThenSemicolon, "1"); // Success ('1', "")

    expect(result1).to.be.instanceOf(Success);
    expect(result1.val).to.eql(["1", ""]);

    expect(result2).to.be.instanceOf(Success);
    expect(result2.val).to.eql(["1", ""]);
  });
  it("between works", () => {
    const pdoublequote = pchar('"');
    const quotedInteger = between(pdoublequote, pint, pdoublequote);

    const result1 = run(quotedInteger, '"1234"'); // Success (1234, "")
    const result2 = run(quotedInteger, "1234"); // Failure "Expecting '"'. Got '1'"

    expect(result1).to.be.instanceOf(Success);
    expect(result1.val).to.eql([1234, ""]);

    expect(result2).to.be.instanceOf(Failure);
    expect(result2.val).to.eql("Expecting '\"'. Got '1'");
  });
  it("sepBy1, sepBy work", () => {
    const comma = pchar(",");
    const digit = anyOf(["1", "2", "3"]);

    const zeroOrMoreDigitList = sepBy(digit, comma);
    const oneOrMoreDigitList = sepBy1(digit, comma);

    const result1 = run(oneOrMoreDigitList, "1;"); // Success (['1'], ";")
    const result2 = run(oneOrMoreDigitList, "1,2;"); // Success (['1'; '2'], ";")
    const result3 = run(oneOrMoreDigitList, "1,2,3;"); // Success (['1'; '2'; '3'], ";")
    const result4 = run(oneOrMoreDigitList, "Z;"); // Failure "Expecting '9'. Got 'Z'"

    const result5 = run(zeroOrMoreDigitList, "1;"); // Success (['1'], ";")
    const result6 = run(zeroOrMoreDigitList, "1,2;"); // Success (['1'; '2'], ";")
    const result7 = run(zeroOrMoreDigitList, "1,2,3;"); // Success (['1'; '2'; '3'], ";")
    const result8 = run(zeroOrMoreDigitList, "Z;"); // Success ([], "Z;")

    expect(result1).to.be.instanceOf(Success);
    expect(result1.val).to.eql([["1"], ";"]);

    expect(result2).to.be.instanceOf(Success);
    expect(result2.val).to.eql([["1", "2"], ";"]);

    expect(result3).to.be.instanceOf(Success);
    expect(result3.val).to.eql([["1", "2", "3"], ";"]);

    expect(result4).to.be.instanceOf(Failure);
    expect(result4.val).to.eql("Expecting '3'. Got 'Z'");

    expect(result5).to.be.instanceOf(Success);
    expect(result5.val).to.eql([["1"], ";"]);

    expect(result6).to.be.instanceOf(Success);
    expect(result6.val).to.eql([["1", "2"], ";"]);

    expect(result7).to.be.instanceOf(Success);
    expect(result7.val).to.eql([["1", "2", "3"], ";"]);

    expect(result8).to.be.instanceOf(Success);
    expect(result8.val).to.eql([[], "Z;"]);
  });
  it("bindP works", () => {
    const andThenb = curry((p1, p2) => {
      return bindP(
        (p1Result) => bindP((p2Result) => returnP([p1Result, p2Result]), p2),
        p1
      );
    });

    const parseA = pchar("A");
    const parseB = pchar("B");
    const parseAThenB = andThenb(parseA)(parseB);

    const result1 = run(parseAThenB)("ABC");
    const result2 = run(parseAThenB)("ZBC");
    const result3 = run(parseAThenB)("AZC");

    expect(result1).to.be.instanceOf(Success);
    expect(result1.val).to.eql([["A", "B"], "C"]);

    expect(result2).to.be.instanceOf(Failure);
    expect(result2.val).to.equal("Expecting 'A'. Got 'Z'");

    expect(result3).to.be.instanceOf(Failure);
    expect(result3.val).to.equal("Expecting 'B'. Got 'Z'");
  });
});
