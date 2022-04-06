//////////////////////////////////Option type
class None {
  map() {
    return this;
  }
}
None.of = function () {
  return new None();
};

class Some {
  constructor(val) {
    this.val = val;
  }
  // map(fn) {
  //   const result = fn(this.val);
  //   if (result instanceof Success || result instanceof Failure) {
  //     return result;
  //   }
  //   return new Success(result);
  // }
}
Some.of = function (x) {
  return new Some(x);
};
//////////////////////////////////Either type
class Failure {
  constructor(label, err) {
    this.val = [label, err];
  }
  map() {
    return this;
  }
  either(failureFn, successFn) {
    return failureFn(this.val);
  }
  getResult() {
    const [label, error] = this.val;
    return `Error parsing ${label}\n${error}`;
  }
}
Failure.of = function (label, x) {
  return new Failure(label, x);
};

class Success {
  constructor(val) {
    this.val = val;
  }
  map(fn) {
    const result = fn(this.val);
    if (result instanceof Success || result instanceof Failure) {
      return result;
    }
    return new Success(result);
  }
  either(failureFn, successFn) {
    return successFn(this.val);
  }
  getResult() {
    const [value, _input] = this.val;
    return value;
  }
}
Success.of = function (x) {
  return new Success(x);
};

// function either(failureFn, successFn, e) {
//   return e instanceof Failure ? failureFn(e.val) : successFn(e.val);
// }

// const rand = () => {
//   let a = Math.random();
//   return a > 0.2 ? new Success(a) : new Failure("A is less that 0.5");
// };

// const result = rand()
//   .map(rand)
//   .map(rand)
//   .either(
//     () => "Failed",
//     (val) => val.toFixed(2)
//   );

// console.log(result);

//////////////////////////////////////////Parser type
class Parser {
  constructor(parser, label) {
    this.parser = parser;
    this.parserLabel = label;
  }
}
Parser.of = function (x) {
  return new Parser(x);
};

module.exports = {
  None,
  Some,
  Success,
  Failure,
  Parser,
};
