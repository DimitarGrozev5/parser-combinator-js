const {
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
} = require("../src/basic-parser");
const { Success, Failure, Parser } = require("../src/types");
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
    expect(result2.val).to.equal("Expecting 'A'. Got 'Z'");

    expect(result3).to.be.instanceOf(Failure);
    expect(result3.val).to.equal("No more input");
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
});
