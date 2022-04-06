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

// Turning a list of parsers in to a single parser
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

// Parser that matches a string
const splitStr = (str) => str.split("");
const mapArr = (fn) => (arr) => arr.map(fn);
const joinArr = (arr) => arr.join("");
// match a specific string
const pstring = (str) =>
  pipe(str)(splitStr, mapArr(pchar), sequence, mapP(joinArr));

// Function that matches a Parser zero or more times
const parseZeroOrMore = curry((parser, input) => {
  // run parser with the input
  const firstResult = run(parser, input);
  // test the result for Failure/Success
  if (firstResult instanceof Failure) {
    // if parse fails, return empty list
    return [[], input];
  } else {
    // if parse succeeds, call recursively
    // to get the subsequent values
    const [firstValue, inputAfterFirstParse] = firstResult.val;
    const [subsequentValues, remainingInput] = parseZeroOrMore(
      parser,
      inputAfterFirstParse
    );
    const values = [firstValue, ...subsequentValues];
    return [values, remainingInput];
  }
});

// match zero or more occurrences of the specified parser
const many = (parser) => {
  // parse the input -- wrap in Success as it always succeeds
  const innerFn = (input) => Success.of(parseZeroOrMore(parser, input));

  return Parser.of(innerFn);
};

// Match zero or more whitespaces
// let whitespaceChar = anyOf [' '; '\t'; '\n']
// let whitespace = many whitespaceChar

// run whitespace "ABC"  // Success ([], "ABC")
// run whitespace " ABC"  // Success ([' '], "ABC")
// run whitespace "\tABC"  // Success (['\t'], "ABC")

// Мatch one or more occurrences of the specified parser
const many1 = (parser) => {
  const innerFn = (input) => {
    // run parser with the input
    const firstResult = run(parser, input);
    // test the result for Failure/Success
    if (firstResult instanceof Failure) {
      return firstResult;
    }
    // if first found, look for zeroOrMore now
    const [firstValue, inputAfterFirstParse] = firstResult.val;
    const [subsequentValues, remainingInput] = parseZeroOrMore(
      parser,
      inputAfterFirstParse
    );
    const values = [firstValue, ...subsequentValues];
    return Success.of([values, remainingInput]);
  };
  return Parser.of(innerFn);
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
  pstring,
  many,
  many1,
};
