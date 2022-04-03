const pipe =
  (val) =>
  (...fns) =>
    fns.reduce((a, fn) => fn(a), fns.shift()(val));

const curry = (fn) => {
  const arity = fn.length;

  function given(argsSoFar) {
    return function helper(...args) {
      const updatedArgsSoFar = [...argsSoFar, ...args];

      if (updatedArgsSoFar.length >= arity) {
        return fn.apply(this, updatedArgsSoFar);
      } else {
        return given(updatedArgsSoFar);
      }
    };
  }

  return given([]);
};

// const test = curry((a, b, c) => a + b + c);
// const t1 = test(1)(2);
// console.log(t1(3));
// console.log(test(1)(5)(5));

module.exports = { pipe, curry };
