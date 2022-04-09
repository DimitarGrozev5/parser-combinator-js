const {
  run,
  printResult,
  pstring,
  satisfy,
  choice,
  pchar,
  anyOf,
  manyChars,
} = require("../basic-parser");
const { Parser } = require("../types");
const {
  JString,
  JNumber,
  JBool,
  JNull,
  JObject,
  JArray,
} = require("./json-types");
const { exp } = require("../helpers");

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

module.exports = {
  jNull,
  jBool,
  jUnescapedChar,
  jEscapedChar,
  jUnicodeChar,
  jString,
};
