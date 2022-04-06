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
  constructor(val) {
    this.val = val;
  }
  map() {
    return this;
  }
  either(failureFn, successFn) {
    return failureFn(this.val);
  }
}
Failure.of = function (x) {
  return new Failure(x);
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
  constructor(parser) {
    this.parser = parser;
  }
  run(val) {
    return this.parser(val);
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
