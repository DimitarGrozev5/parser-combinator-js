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

// Doesn't work
const addFnAsDotToParser = (label, object, fn) => {
  object.prototype[label] = function (...args) {
    const allArgs = [this, ...args];
    return fn(...allArgs);
  };
};

module.exports = { pipe, curry, addFnAsDotToParser };
