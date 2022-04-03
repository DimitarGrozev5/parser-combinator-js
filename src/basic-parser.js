const { Success, Failure, Parser } = require("./types");
const { pipe, curry } = require("./helpers");

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
    const msg = `Expecting '${charToMatch}'. Got '${first}'`;
    return new Failure(msg);
  };
  return Parser.of(innerFn);
};

const run = curry((parser, input) => parser.parser(input));

const andThen = curry((parser1, parser2) => {
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
});

const orElse = curry((parser1, parser2) => {
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
});

const choice = (listOfParsers) => listOfParsers.reduce(orElse);
const anyOf = (listOfChars) => choice(listOfChars.map((char) => pchar(char)));

// let mapP f parser =
//   let innerFn input =
//     // run parser with the input
//     let result = run parser input

//     // test the result for Failure/Success
//     match result with
//     | Success (value,remaining) ->
//       // if success, return the value transformed by f
//       let newValue = f value
//       Success (newValue, remaining)

//     | Failure err ->
//       // if failed, return the error
//       Failure err
//   // return the inner function
//   Parser innerFn

module.exports = {
  pchar,
  run,
  andThen,
  orElse,
  choice,
  anyOf,
};
