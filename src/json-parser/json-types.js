// type JValue =
//   | JString of string
//   | JNumber of float
//   | JBool   of bool
//   | JNull
//   | JObject of Map<string, JValue>
//   | JArray  of JValue list

class JString {
  constructor(val) {
    this.val = val;
  }
}
JString.of = (val) => new JString(val);

class JNumber {
  constructor(val) {
    this.val = val;
  }
}
JNumber.of = (val) => new JNumber(val);

class JBool {
  constructor(val) {
    this.val = val;
  }
}
JBool.of = (val) => new JBool(val);

class JNull {}
JNull.of = () => new JNull();

class JObject {
  constructor(val) {
    this.val = val;
  }
}
JObject.of = (val) => new JObject(val);

class JArray {
  constructor(val) {
    this.val = val;
  }
}
JArray.of = (val) => new JArray(val);

module.exports = {
  JString,
  JNumber,
  JBool,
  JNull,
  JObject,
  JArray,
};
