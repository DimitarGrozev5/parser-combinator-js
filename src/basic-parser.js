const { Success, Failure, Parser } = require("./types");
const { pipe } = require("./helpers");

const pchar = (charToMatch) => {
  const innerFn = (str) => {
    if (!str) {
      return new Failure("No more input");
    }
    const first = str[0];
    if (first === charToMatch) {
      const remaining = str.slice(1);
      return new Success([charToMatch, remaining]);
    }
    const msg = `Expectin '${charToMatch}'. Got '${first}'`;
    return new Failure(msg);
  };
  return Parser.of(innerFn);
};

const run = (parser) => (input) => parser.parser(input);
const andThen = (parser1) => (parser2) => {
  const innerFn = (input) => {
    const result1 = run(parser1)(input);
    if (result1 instanceof Failure) {
      return result1;
    }

    if (result1 instanceof Success) {
      const result2 = run(parser2)(result1.val[1]);

      if (result2 instanceof Failure) {
        return result2;
      }
      if (result2 instanceof Success) {
        const newValue = [result1.val[0], result2.val[0]];
        return Success.of([newValue, result2.val[1]]);
      }
    }

    return Failure.of("Invalid input function");
  };

  return Parser.of(innerFn);
};
const orElse = (parser1, parser2) => {
  const innerFn = (input) => {
    const result1 = run(parser1)(input);
    if (result1 instanceof Success) {
      return result1;
    }

    if (result1 instanceof Failure) {
      const result2 = run(parser2)(input);
      return result2;
    }

    return Failure.of("Invalid input function");
  };

  return Parser.of(innerFn);
};

const choice = (listOfParsers) => listOfParsers.reduce(orElse);
const anyOf = (listOfChars) => choice(listOfChars.map((char) => pchar(char)));

const parseDigit = anyOf(["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]);

console.log(run(parseDigit)("ffd"))

// Testing
const parseA = pchar("A");
const parseB = pchar("B");
// const parseAThenB = parseA.andThen(parseB);
const parseAThenB = andThen(parseA)(parseB);

// console.log(parseAThenB.run("ABC"));
// console.log(parseAThenB.run("ZBC"));
// console.log(parseAThenB.run("AZC"));

// const parseAOrElseB = parseA.orElse(parseB);
const parseAOrElseB = orElse(parseA, parseB);

// console.log(parseAOrElseB.run("AZZ"));
// console.log(parseAOrElseB.run("BZZ"));
// console.log(parseAOrElseB.run("CZZ"));

const parseC = pchar("C");
const bOrElseC = parseB.orElse(parseC);
const aAndThenBorC = parseA.andThen(bOrElseC);

// console.log(aAndThenBorC.run("ABZ"));
// console.log(aAndThenBorC.run("ACZ"));
// console.log(aAndThenBorC.run("QBZ"));
// console.log(aAndThenBorC.run("AQZ"));

const oneOf = choice([parseA, parseB, parseC]);

// console.log(run(oneOf)("ABC"));
