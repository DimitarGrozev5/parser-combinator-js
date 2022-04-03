const {
  pchar,
  run,
  andThen,
  orElse,
  choice,
  anyOf,
} = require("../src/basic-parser");
const { Success, Failure, Parser } = require("../src/types");
const { expect } = require("chai");

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
});
