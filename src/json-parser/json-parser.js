const { pstring } = require("../basic-parser");
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

module.exports = {
  jNull,
  jBool,
};
