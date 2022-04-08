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
const {
  None,
  Some,
  Success,
  Failure,
  Parser,
  ParserPosition,
  InputState,
} = require("../src/types");
const { expect } = require("chai");
const { curry } = require("../src/helpers");

describe("Tests for basic parsers", () => {
  it("printResult works", () => {
    const s = Success.of(5);
    const result1 = printResult(s);
    expect(result1).to.equal(5);

    const exampleError = Failure.of(
      "identifier",
      "unexpected |",
      ParserPosition.of("123 ab|cd", 1, 6)
    );
    const result2 = printResult(exampleError);
    expect(result2).to.equal(
      "Line:1 Col:6 Error parsing identifier\n123 ab|cd\n      ^unexpected |"
    );
  });
  it("pchar works", () => {
    const parseA = pchar("A");

    const result1 = run(parseA)("ABC");
    const result2 = run(parseA)("ZBC");
    const result3 = run(parseA)("");

    expect(result1).to.be.instanceOf(Success);
    expect(result1.val[0]).to.equal("A");
    expect(result1.val[1]).to.be.instanceOf(InputState);

    expect(result2).to.be.instanceOf(Failure);
    expect(result2.val.slice(0, 2)).to.eql(["A", "Unexpected 'Z'"]);
    expect(printResult(result2)).to.equal(
      "Line:0 Col:0 Error parsing A\nZBC\n^Unexpected 'Z'"
    );

    expect(result3).to.be.instanceOf(Failure);
    expect(result3.val.slice(0, 2)).to.eql(["A", "No more input"]);
  });
  it("andThen works", () => {
    const parseA = pchar("A");
    const parseB = pchar("B");
    const parseAThenB = andThen(parseA)(parseB);

    const result1 = run(parseAThenB)("ABC");
    const result2 = run(parseAThenB)("ZBC");
    const result3 = run(parseAThenB)("AZC");

    expect(result1).to.be.instanceOf(Success);
    expect(result1.val[0]).to.eql(["A", "B"]);

    expect(result2).to.be.instanceOf(Failure);
    expect(result2.val.slice(0, 2)).to.eql(["A andThen B", "Unexpected 'Z'"]);

    expect(result3).to.be.instanceOf(Failure);
    expect(result3.val.slice(0, 2)).to.eql(["A andThen B", "Unexpected 'Z'"]);
  });
  it("infix andThen works", () => {
    const parseA = pchar("A");
    const parseB = pchar("B");
    const parseAThenB = parseA.andThen(parseB);

    const result1 = run(parseAThenB)("ABC");
    const result2 = run(parseAThenB)("ZBC");
    const result3 = run(parseAThenB)("AZC");

    expect(result1).to.be.instanceOf(Success);
    expect(result1.val[0]).to.eql(["A", "B"]);

    expect(result2).to.be.instanceOf(Failure);
    expect(result2.val.slice(0, 2)).to.eql(["A andThen B", "Unexpected 'Z'"]);

    expect(result3).to.be.instanceOf(Failure);
    expect(result3.val.slice(0, 2)).to.eql(["A andThen B", "Unexpected 'Z'"]);
  });
  it("orElse works", () => {
    const parseA = pchar("A");
    const parseB = pchar("B");
    const parseAOrElseB = orElse(parseA, parseB);

    const result1 = run(parseAOrElseB)("AZZ");
    const result2 = run(parseAOrElseB)("BZZ");
    const result3 = run(parseAOrElseB)("CZZ");

    expect(result1).to.be.instanceOf(Success);
    expect(result1.val[0]).to.eql("A");

    expect(result2).to.be.instanceOf(Success);
    expect(result2.val[0]).to.eql("B");

    expect(result3).to.be.instanceOf(Failure);
    expect(result3.val.slice(0, 2)).to.eql(["B", "Unexpected 'C'"]);
  });
  it("infix orElse works", () => {
    const parseA = pchar("A");
    const parseB = pchar("B");
    const parseAOrElseB = parseA.orElse(parseB);

    const result1 = run(parseAOrElseB)("AZZ");
    const result2 = run(parseAOrElseB)("BZZ");
    const result3 = run(parseAOrElseB)("CZZ");

    expect(result1).to.be.instanceOf(Success);
    expect(result1.val[0]).to.eql("A");

    expect(result2).to.be.instanceOf(Success);
    expect(result2.val[0]).to.eql("B");

    expect(result3).to.be.instanceOf(Failure);
    expect(result3.val.slice(0, 2)).to.eql(["B", "Unexpected 'C'"]);
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
    expect(result1.val[0]).to.eql("A");

    expect(result2).to.be.instanceOf(Success);
    expect(result2.val[0]).to.eql("B");

    expect(result3).to.be.instanceOf(Success);
    expect(result3.val[0]).to.eql("C");

    expect(result4).to.be.instanceOf(Failure);
    expect(result4.val.slice(0, 2)).to.eql(["C", "Unexpected 'Z'"]);
  });
  it("anyOf works", () => {
    const parceABOrC = anyOf(["A", "B", "C"]);

    const result1 = run(parceABOrC)("AZZ");
    const result2 = run(parceABOrC)("BZZ");
    const result3 = run(parceABOrC)("CZZ");
    const result4 = run(parceABOrC)("ZZZ");

    expect(result1).to.be.instanceOf(Success);
    expect(result1.val[0]).to.eql("A");

    expect(result2).to.be.instanceOf(Success);
    expect(result2.val[0]).to.eql("B");

    expect(result3).to.be.instanceOf(Success);
    expect(result3.val[0]).to.eql("C");

    expect(result4).to.be.instanceOf(Failure);
    expect(result4.val.slice(0, 2)).to.eql(["any of A,B,C", "Unexpected 'Z'"]);
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
    expect(result1.val[0]).to.eql("123");

    expect(result2).to.be.instanceOf(Failure);
    expect(result2.val.slice(0, 2)).to.eql([
      "any of 1,2,3 andThen any of 1,2,3 andThen any of 1,2,3",
      "Unexpected 'A'",
    ]);
    console.log(printResult(result2));
  });
  it("pipe in mapP works", () => {
    const parseDigit = anyOf(["1", "2", "3"]);

    // create a parser that returns a tuple
    const tupleParser = andThen(andThen(parseDigit, parseDigit), parseDigit);

    // create a function that turns the tuple into a string
    const transformTuple = ([[c1, c2], c3]) => "" + c1 + c2 + c3;

    // use "map" to combine them
    const parseThreeDigitsAsStr = tupleParser.pipeInMapP(transformTuple);

    const result1 = run(parseThreeDigitsAsStr, "123A");
    const result2 = run(parseThreeDigitsAsStr, "12AA");

    expect(result1).to.be.instanceOf(Success);
    expect(result1.val[0]).to.eql("123");

    expect(result2).to.be.instanceOf(Failure);
    expect(result2.val.slice(0, 2)).to.eql([
      "any of 1,2,3 andThen any of 1,2,3 andThen any of 1,2,3",
      "Unexpected 'A'",
    ]);
  });
  it("returnP works", () => {
    const testParser = returnP("A");
    expect(testParser).to.be.instanceOf(Parser);

    const parseString = run(testParser, "BC");
    expect(parseString).to.be.instanceOf(Success);
    expect(parseString.val[0]).to.eql("A");
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
    expect(result2.val[0]).to.eql(2);
  });
  it("infix applyP works", () => {
    const add = (a) => a + 1;
    expect(add(1)).to.equal(2);

    const addP = returnP(add);
    const p1 = returnP(1);

    const result1 = addP.applyP(p1);
    expect(result1).to.be.instanceOf(Parser);

    const result2 = run(result1, "BC");
    expect(result2).to.be.instanceOf(Success);
    expect(result2.val[0]).to.eql(2);
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
    expect(result2.val[0]).to.eql(2);
  });
  it("lift2 works", () => {
    const add = curry((a, b) => a + b);
    expect(add(2, 2)).to.equal(4);

    const liftedAdd = lift2(add);
    const result = liftedAdd(returnP(2), returnP(2));
    expect(result).to.be.instanceOf(Parser);

    const result1 = run(result, "BC");
    expect(result1).to.be.instanceOf(Success);
    expect(result1.val[0]).to.eql(4);
  });
  it("sequence works", () => {
    const parsers = [pchar("A"), pchar("B"), pchar("C")];
    let combined = sequence(parsers);

    const result = run(combined, "ABCD");

    expect(result).to.be.instanceOf(Success);
    expect(result.val[0]).to.eql(["A", "B", "C"]);
  });
  it("pstring works", () => {
    const parseABC = pstring("ABC").setLabel("ABC");

    const result1 = run(parseABC, "ABCDE"); // Success ("ABC", "DE")
    const result2 = run(parseABC, "A|CDE"); // Failure "Expecting 'B'. Got '|'"
    const result3 = run(parseABC, "AB|DE"); // Failure "Expecting 'C'. Got '|'"

    expect(result1).to.be.instanceOf(Success);
    expect(result1.val[0]).to.eql("ABC");

    expect(result2).to.be.instanceOf(Failure);
    expect(result2.val.slice(0, 2)).to.eql(["ABC", "Unexpected '|'"]);

    expect(result3).to.be.instanceOf(Failure);
    expect(result3.val.slice(0, 2)).to.eql(["ABC", "Unexpected '|'"]);
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
    expect(result1.val[0]).to.eql(["A"]);

    expect(result2).to.be.instanceOf(Success);
    expect(result2.val[0]).to.eql(["A", "A"]);

    expect(result3).to.be.instanceOf(Success);
    expect(result3.val[0]).to.eql(["A", "A", "A"]);

    expect(result4).to.be.instanceOf(Success);
    expect(result4.val[0]).to.eql([]);
  });
  it("many works; take 2", () => {
    const manyAB = many(pstring("AB"));

    const result1 = run(manyAB, "ABCD"); // Success (["AB"], "CD")
    const result2 = run(manyAB, "ABABCD"); // Success (["AB"; "AB"], "CD")
    const result3 = run(manyAB, "ZCD"); // Success ([], "ZCD")
    const result4 = run(manyAB, "AZCD"); // Success ([], "AZCD")

    expect(result1).to.be.instanceOf(Success);
    expect(result1.val[0]).to.eql(["AB"]);

    expect(result2).to.be.instanceOf(Success);
    expect(result2.val[0]).to.eql(["AB", "AB"]);

    expect(result3).to.be.instanceOf(Success);
    expect(result3.val[0]).to.eql([]);

    expect(result4).to.be.instanceOf(Success);
    expect(result4.val[0]).to.eql([]);
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
    expect(result1.val[0]).to.eql(["1"]);

    expect(result2).to.be.instanceOf(Success);
    expect(result2.val[0]).to.eql(["1", "2"]);

    expect(result3).to.be.instanceOf(Success);
    expect(result3.val[0]).to.eql(["1", "2", "3"]);

    expect(result4).to.be.instanceOf(Success);
    expect(result4.val[0]).to.eql(["1", "2", "3", "4"]);

    expect(result5).to.be.instanceOf(Failure);
    expect(result5.val.slice(0, 2)).to.eql([
      "any of 1,2,3,4",
      "Unexpected 'A'",
    ]);
  });
  it("pint works", () => {
    const result1 = run(pint, "1ABC"); // Success (1, "ABC")
    const result2 = run(pint, "12BC"); // Success (12, "BC")
    const result3 = run(pint, "123C"); // Success (123, "C")
    const result4 = run(pint, "1234"); // Success (1234, "")
    const result5 = run(pint, "ABC"); // Failure "Expecting '9'. Got 'A'"

    const result6 = run(pint, "-123C"); // Success (123, "C")

    expect(result1).to.be.instanceOf(Success);
    expect(result1.val[0]).to.eql(1);

    expect(result2).to.be.instanceOf(Success);
    expect(result2.val[0]).to.eql(12);

    expect(result3).to.be.instanceOf(Success);
    expect(result3.val[0]).to.eql(123);

    expect(result4).to.be.instanceOf(Success);
    expect(result4.val[0]).to.eql(1234);

    expect(result5).to.be.instanceOf(Failure);
    expect(result5.val.slice(0, 2)).to.eql(["Integer", "Unexpected 'A'"]);

    expect(result6).to.be.instanceOf(Success);
    expect(result6.val[0]).to.eql(-123);
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

    expect(result2).to.be.instanceOf(Success);
    const [[res2, op2], rem2] = result2.val;
    expect(res2).to.equal("1");
    expect(op2).to.be.instanceOf(None);
  });
  it("andThen1 works", () => {
    const digit = anyOf(["1"]);

    // use .>> below
    let digitThenSemicolon = andThen1(digit, opt(pchar(";")));

    const result1 = run(digitThenSemicolon, "1;"); // Success ('1', "")
    const result2 = run(digitThenSemicolon, "1"); // Success ('1', "")

    expect(result1).to.be.instanceOf(Success);
    expect(result1.val[0]).to.eql("1");

    expect(result2).to.be.instanceOf(Success);
    expect(result2.val[0]).to.eql("1");
  });
  it("infix andThen1 works", () => {
    const digit = anyOf(["1"]);

    // use .>> below
    let digitThenSemicolon = digit.andThen1(opt(pchar(";")));

    const result1 = run(digitThenSemicolon, "1;"); // Success ('1', "")
    const result2 = run(digitThenSemicolon, "1"); // Success ('1', "")

    expect(result1).to.be.instanceOf(Success);
    expect(result1.val[0]).to.eql("1");

    expect(result2).to.be.instanceOf(Success);
    expect(result2.val[0]).to.eql("1");
  });
  it("between works", () => {
    const pdoublequote = pchar('"');
    const quotedInteger = between(pdoublequote, pint, pdoublequote);

    const result1 = run(quotedInteger, '"1234"'); // Success (1234, "")
    const result2 = run(quotedInteger, "1234"); // Failure "Expecting '"'. Got '1'"

    expect(result1).to.be.instanceOf(Success);
    expect(result1.val[0]).to.eql(1234);

    expect(result2).to.be.instanceOf(Failure);
    expect(result2.val.slice(0, 2)).to.eql(['between ""', "Unexpected '1'"]);
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
    expect(result1.val[0]).to.eql(["1"]);

    expect(result2).to.be.instanceOf(Success);
    expect(result2.val[0]).to.eql(["1", "2"]);

    expect(result3).to.be.instanceOf(Success);
    expect(result3.val[0]).to.eql(["1", "2", "3"]);

    expect(result4).to.be.instanceOf(Failure);
    expect(result4.val.slice(0, 2)).to.eql([
      "any of 1,2,3 andThen zero or many any of 1,2,3",
      "Unexpected 'Z'",
    ]);

    expect(result5).to.be.instanceOf(Success);
    expect(result5.val[0]).to.eql(["1"]);

    expect(result6).to.be.instanceOf(Success);
    expect(result6.val[0]).to.eql(["1", "2"]);

    expect(result7).to.be.instanceOf(Success);
    expect(result7.val[0]).to.eql(["1", "2", "3"]);

    expect(result8).to.be.instanceOf(Success);
    expect(result8.val[0]).to.eql([]);
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
    expect(result1.val[0]).to.eql(["A", "B"]);

    expect(result2).to.be.instanceOf(Failure);
    expect(result2.val.slice(0, 2)).to.eql(["A", "Unexpected 'Z'"]);

    expect(result3).to.be.instanceOf(Failure);
    expect(result3.val.slice(0, 2)).to.eql(["B", "Unexpected 'Z'"]);
  });
  it("infix bindP works", () => {
    const andThenb = curry((p1, p2) =>
      p1.bindP((p1Result) =>
        p2.bindP((p2Result) => returnP([p1Result, p2Result]))
      )
    );

    const parseA = pchar("A");
    const parseB = pchar("B");
    const parseAThenB = andThenb(parseA, parseB);

    const result1 = run(parseAThenB)("ABC");
    const result2 = run(parseAThenB)("ZBC");
    const result3 = run(parseAThenB)("AZC");

    expect(result1).to.be.instanceOf(Success);
    expect(result1.val[0]).to.eql(["A", "B"]);

    expect(result2).to.be.instanceOf(Failure);
    expect(result2.val.slice(0, 2)).to.eql(["A", "Unexpected 'Z'"]);

    expect(result3).to.be.instanceOf(Failure);
    expect(result3.val.slice(0, 2)).to.eql(["B", "Unexpected 'Z'"]);
  });
});
