const {
  run,
  printResult,
  pstring,
  satisfy,
  choice,
  pchar,
  anyOf,
  manyChars,
  opt,
  manyChars1,
  spaces,
  spaces1,
  sepBy,
  between,
} = require("../basic-parser");
const { Parser, None, Some } = require("../types");
const {
  JString,
  JNumber,
  JBool,
  JNull,
  JObject,
  JArray,
} = require("./json-types");
const { exp, pipe } = require("../helpers");

// Parsing null
Parser.prototype.return = function (type) {
  return this.mapP((_) => type);
};
const jNull = pstring("null").return(JNull.of()).setLabel("null");

// Parsing bool
const jBool = exp(() => {
  const jtrue = pstring("true").return(JBool.of(true));
  const jfalse = pstring("false").return(JBool.of(false));
  return jtrue.orElse(jfalse).setLabel("bool");
});

// Parse unescaped string char
const jUnescapedChar = satisfy((ch) => ch !== "\\" && ch !== '"', "char");

// Parse escaped string char
/// Parse an escaped char
const jEscapedChar = choice(
  [
    // (stringToMatch, resultChar)
    ['\\"', '"'], // quote
    ["\\\\", "\\"], // reverse solidus
    ["\\/", "/"], // solidus
    ["\\b", "\b"], // backspace
    ["\\f", "\f"], // formfeed
    ["\\n", "\n"], // newline
    ["\\r", "\r"], // cr
    ["\\t", "\t"], // tab
  ].map(([toMatch, result]) => pstring(toMatch).return(result))
).setLabel("escaped char");

// Parse hexdigit
/// Parse a unicode char
const jUnicodeChar = exp(() => {
  // set up the "primitive" parsers
  const backslash = pchar("\\");
  const uChar = pchar("u");
  const hexdigit = anyOf([
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
  ]);
  const fourHexDigits = hexdigit
    .andThen(hexdigit)
    .andThen(hexdigit)
    .andThen(hexdigit);

  // convert the parser output (nested tuples)
  // to a char
  const convertToChar = ([[[h1, h2], h3], h4]) => {
    const str = `${h1}${h2}${h3}${h4}`;
    return String.fromCodePoint(parseInt(str, 16));
  };

  // set up the main parser
  // backslash >>. uChar >>. fourHexDigits
  // |>> convertToChar
  return backslash.andThen2(uChar).andThen2(fourHexDigits).mapP(convertToChar);
});

// Parse quoted string
const quotedString = exp(() => {
  const quote = pchar('"').setLabel("quote");
  const jchar = jUnescapedChar.orElse(jEscapedChar).orElse(jUnicodeChar);

  // set up the main parser
  // quote >>. manyChars jchar .>> quote
  return quote.andThen2(manyChars(jchar)).andThen1(quote);
});

/// Parse a JString
const jString = quotedString.mapP(JString.of).setLabel("quoted string");

// utility function to convert an optional value
// to a string, or "" if missing
None.prototype.opToStr = function () {
  return "";
};
Some.prototype.opToStr = function (fn) {
  return fn(this.val);
};
/// Parse a JNumber
const jNumber = exp(() => {
  // set up the "primitive" parsers
  const optSign = opt(pchar("-"));
  const zero = pstring("0");
  const digitOneNine = satisfy((ch) => /[1-9]/.test(ch), "1-9");
  const digit = satisfy((ch) => /[0-9]/.test(ch), "digit");
  const point = pchar(".");
  const e = pchar("e").orElse(pchar("E"));
  const optPlusMinus = opt(pchar("-").orElse(pchar("+")));

  const nonZeroInt = digitOneNine
    .andThen(manyChars(digit))
    .mapP(([first, rest]) => `${first}${rest}`);
  const intPart = zero.orElse(nonZeroInt);
  const fractionPart = point.andThen2(manyChars1(digit));
  const exponentPart = e.andThen2(optPlusMinus).andThen(manyChars1(digit));

  const convertToJNumber = ([[[optSign, intPart], fractionPart], expPart]) => {
    // convert to strings and let .NET parse them!
    // -- crude but ok for now.
    const signStr = optSign.opToStr((x) => x);

    const fractionPartStr = fractionPart.opToStr((digits) => "." + digits);

    const expPartStr = expPart.opToStr(([optSign, digits]) => {
      const sign = optSign.opToStr((x) => x);
      return "e" + sign + digits;
    });

    // add the parts together and convert to a float,
    // then wrap in a JNumber
    return pipe(signStr + intPart + fractionPartStr + expPartStr)(
      parseFloat,
      JNumber.of
    );
    // parseFloat(signStr + intPart + fractionPartStr + expPartStr)
    // |> float
    // |> JNumber
  };

  // set up the main parser
  // optSign .>>. intPart .>>. opt fractionPart .>>. opt exponentPart
  // |>> convertToJNumber
  // <?> "number"   // add label
  return optSign
    .andThen(intPart)
    .andThen(opt(fractionPart))
    .andThen(opt(exponentPart))
    .mapP(convertToJNumber)
    .setLabel("number");
});
const jNumber_ = jNumber.andThen1(spaces1);

const jArray = exp(() => {
  const left = pchar("[").andThen1(spaces);
  const right = pchar("]").andThen1(spaces);
  const comma = pchar(",").andThen1(spaces);
  const value = jNumber.andThen1(spaces); ////////////////////////////////////////////////////////////////////

  // set up the list parser
  const values = sepBy(value, comma);

  // set up the main parser
  return between(left, values, right).mapP(JArray.of).setLabel("array");
});

module.exports = {
  jNull,
  jBool,
  jUnescapedChar,
  jEscapedChar,
  jUnicodeChar,
  jString,
  jNumber,
  jNumber_,
  jArray,
};
