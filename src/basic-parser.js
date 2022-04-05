const { Success, Failure, Parser } = require("./types");
const { pipe, curry, addFnAsDotToParser } = require("./helpers");

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

// .>>.
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
addFnAsDotToParser("andThen", Parser, andThen);

// <|>
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
// addFnAsDotToParser("orElse", Parser, orElse);

const choice = (listOfParsers) => listOfParsers.reduce(orElse);
const anyOf = (listOfChars) => choice(listOfChars.map((char) => pchar(char)));

// <!>
// |>>
const mapP = curry((f, parser) => {
  const innerFn = (input) => {
    // run parser with the input
    const result = run(parser, input);

    // test the result for Failure/Success
    if (result instanceof Success) {
      const [value, remaining] = result.val;
      // if success, return the value transformed by f
      const newValue = f(value);
      return Success.of([newValue, remaining]);
    }
    // if failed, return the error
    return result;
  };

  return Parser.of(innerFn);
});

const returnP = (x) => {
  const innerFn = (input) => {
    // ignore the input and return x
    return Success.of([x, input]);
  };
  // return the inner function
  return Parser.of(innerFn);
};

// <*>
const applyP = curry((fP, xP) => {
  // create a Parser containing a pair (f,x)
  const parser = andThen(fP, xP);
  // map the pair by applying f to x
  return mapP(([f, x]) => f(x), parser);
});

const lift2 = curry((f, xP, yP) => applyP(applyP(returnP(f), xP), yP));

// Untested
// const startsWith = curry((str, prefix) => str.startsWith(prefix));
// const startsWithP = lift2(startsWith);

const sequence = (parserList) => {
  // define the "cons" function, which is a two parameter function
  const cons = curry((head, tail) => [head, ...tail]);

  // lift it to Parser World
  const consP = lift2(cons);

  // process the list of parsers recursively
  if (parserList.length === 0) {
    return returnP([]);
  } else {
    return consP(parserList[0], sequence(parserList.slice(1)));
  }
};

module.exports = {
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
};
