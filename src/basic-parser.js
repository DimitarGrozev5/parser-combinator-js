const {
  None,
  Some,
  Success,
  Failure,
  Parser,
  ParserPosition,
} = require("./types");
const { pipe, curry } = require("./helpers");
const InputState = require("./input-state");

const parserPositionFromInputState = (inputState) =>
  ParserPosition.of(
    InputState.currentLine(inputState),
    inputState.position.line,
    inputState.position.column
  );

const printResult = (result) => {
  if (result instanceof Success) {
    return result.val;
  } else if (result instanceof Failure) {
    const [label, error, parserPos] = result.val;

    const errorLine = parserPos.currentLine;
    const colPos = parserPos.column;
    const linePos = parserPos.line;
    const failureCaret = `${Array(colPos).fill(" ").join("")}^${error}`;
    return `Line:${linePos} Col:${colPos} Error parsing ${label}\n${errorLine}\n${failureCaret}`;
  }
};

/// Update the label in the parser
const setLabel = curry((parser, newLabel) => {
  // change the inner function to use the new label
  const newInnerFn = (input) => {
    const result = parser.parser(input);
    if (result instanceof Success) {
      return result;
    } else {
      // if Failure, return new label
      const [oldLabel, err, pos] = result.val;
      return Failure.of(newLabel, err, pos);
    }
  };
  // return the Parser
  return Parser.of(newInnerFn, newLabel);
});
Parser.prototype.setLabel = function (newLabel) {
  return setLabel(this, newLabel);
};

/// get the label from a parser
const getLabel = (parser) =>
  // get label
  parser.parserLabel;

/// Match an input token if the predicate is satisfied
const satisfy = curry((predicate, label) => {
  const innerFn = (input) => {
    const [remainingInput, charOpt] = InputState.nextChar(input);
    if (charOpt instanceof None) {
      const err = "No more input";
      const pos = parserPositionFromInputState(input);

      return Failure.of(label, err, pos);
    } else {
      const first = charOpt.val;
      if (predicate(first)) {
        // <====== use predicate here
        return Success.of([first, remainingInput]);
      } else {
        const err = `Unexpected '${first}'`;
        const pos = parserPositionFromInputState(input);
        return Failure.of(label, err, pos);
      }
    }
  };
  // return the parser
  return Parser.of(innerFn, label);
});

const pchar = (charToMatch) => {
  const predicate = (ch) => ch === charToMatch;
  const label = `${charToMatch}`;
  return satisfy(predicate, label);
};

/// Run the parser on a InputState
const runOnInput = curry((parser, input) =>
  // call inner function with input
  parser.parser(input)
);

/// Run the parser on a string
const run = curry((parser, inputStr) =>
  // call inner function with input
  runOnInput(parser, InputState.fromStr(inputStr))
);

const returnP = (x) => {
  const label = `${x}`;
  const innerFn = (input) => {
    // ignore the input and return x
    return Success.of([x, input]);
  };
  // return the inner function
  return Parser.of(innerFn, label);
};

/// "bindP" takes a parser-producing function f, and a parser p
/// and passes the output of p into f, to create a new parser
const bindP = curry((f, p) => {
  const label = "unknown";
  const innerFn = (input) => {
    const result1 = runOnInput(p, input);
    // return error from parser1
    if (result1 instanceof Failure) {
      return result1;
    }

    const [value1, remainingInput] = result1.val;
    // apply f to get a new parser
    const p2 = f(value1);
    // run parser with remaining input
    return runOnInput(p2, remainingInput);
  };
  return Parser.of(innerFn, label);
});
Parser.prototype.bindP = function (f) {
  return bindP(f, this);
};

// .>>.
const andThen = curry((p1, p2) =>
  p1
    .bindP((p1Result) => p2.bindP((p2Result) => returnP([p1Result, p2Result])))
    .setLabel(`${getLabel(p1)} andThen ${getLabel(p2)}`)
);
Parser.prototype.andThen = function (parser2) {
  return andThen(this, parser2);
};

// <|>
const orElse = curry((parser1, parser2) => {
  const label = `${getLabel(parser1)} orElse ${getLabel(parser2)}`;
  const innerFn = (input) => {
    const result1 = runOnInput(parser1)(input);
    if (result1 instanceof Success) {
      return result1;
    }

    if (result1 instanceof Failure) {
      const result2 = runOnInput(parser2)(input);
      return result2;
    }
  };

  return Parser.of(innerFn, label);
});
Parser.prototype.orElse = function (parser2) {
  return orElse(this, parser2);
};

const choice = (listOfParsers) => listOfParsers.reduce(orElse);
const anyOf = (listOfChars) => {
  const label = `any of ${listOfChars}`;
  const c = choice(listOfChars.map((char) => pchar(char)));
  return setLabel(c, label);
};

// <!>
// |>>
const mapP = curry((f, parser) => {
  const innerFn = (input) => {
    // run parser with the input
    const result = runOnInput(parser, input);

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
Parser.prototype.pipeInMapP = function (f) {
  return mapP(f, this);
};

// <*>
const applyP = curry((fP, xP) => {
  // create a Parser containing a pair (f,x)
  const parser = andThen(fP, xP);
  // map the pair by applying f to x
  return mapP(([f, x]) => f(x), parser);
});
Parser.prototype.applyP = function (xP) {
  return applyP(this, xP);
};

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
  let label = `zero or many ${getLabel(parser)}`;
  // parse the input -- wrap in Success as it always succeeds
  const innerFn = (input) => Success.of(parseZeroOrMore(parser, input));

  return Parser.of(innerFn, label);
};

// Match zero or more whitespaces
// let whitespaceChar = anyOf [' '; '\t'; '\n']
// let whitespace = many whitespaceChar

// run whitespace "ABC"  // Success ([], "ABC")
// run whitespace " ABC"  // Success ([' '], "ABC")
// run whitespace "\tABC"  // Success (['\t'], "ABC")

// Мatch one or more occurrences of the specified parser
const many1 = (parser) => {
  let label = `many ${getLabel(parser)}`;
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
  return Parser.of(innerFn, label);
};

// Optional char - zero or one occurence
const opt = (p) => {
  const some = mapP(Some.of, p);
  const none = returnP(None.of());
  return orElse(some, none);
};

const pint = (() => {
  // helper
  const resultToInt = ([sign, charList]) => {
    let i = +charList.join("");
    if (sign instanceof Some) {
      return -1 * i;
    } else {
      return i;
    }
  };

  // define parser for one digit
  const digit = anyOf(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]);

  // define parser for one or more digits
  const digits = many1(digit);

  // parse and convert
  const minusAndDigits = andThen(opt(pchar("-")), digits);
  return mapP(resultToInt, minusAndDigits);
})();

// .>>
const andThen1 = curry((p1, p2) => {
  const pair = andThen(p1, p2);
  return mapP(([a, b]) => a, pair);
});
Parser.prototype.andThen1 = function (parser2) {
  return andThen1(this, parser2);
};

// >>.
const andThen2 = curry((p1, p2) => {
  const pair = andThen(p1, p2);
  return mapP(([a, b]) => b, pair);
});
Parser.prototype.andThen2 = function (parser2) {
  return andThen2(this, parser2);
};

// Return two parsers, diregard whitespace between them
// let whitespaceChar = anyOf [' '; '\t'; '\n']
// let whitespace = many1 whitespaceChar

// let ab = pstring "AB"
// let cd = pstring "CD"
// let ab_cd = (ab .>> whitespace) .>>. cd

// run ab_cd "AB \t\nCD"   // Success (("AB", "CD"), "")

// Keep only the result of the middle parser
const between = curry((p1, p2, p3) => {
  const p12 = andThen2(p1, p2);
  return andThen1(p12, p3);
});

/// Parses one or more occurrences of p separated by sep
const sepBy1 = curry((p, sep) => {
  const sepThenP = andThen2(sep, p);
  const pAndMany = andThen(p, many(sepThenP));
  return mapP(([p, pList]) => [p, ...pList], pAndMany);
});

/// Parses zero or more occurrences of p separated by sep
const sepBy = curry((p, sep) => {
  const s = sepBy1(p, sep);
  const empty = returnP([]);
  return orElse(s, empty);
});

module.exports = {
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
};
