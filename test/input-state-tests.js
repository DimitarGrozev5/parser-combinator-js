const { InputState, Position, None, Some } = require("../src/types");
const {
  initialPos,
  incrCol,
  incrLine,
  fromStr,
  nextChar,
  readAllChars,
} = require("../src/input-state");
const { expect } = require("chai");
const { curry } = require("../src/helpers");

describe("input-state tests", () => {
  it("initialPos works", () => {
    expect(initialPos).to.be.instanceOf(Position);
    expect(initialPos).to.eql({ line: 0, column: 0 });
  });
  it("incrCol works", () => {
    const newPos = incrCol(initialPos);
    expect(newPos).to.be.instanceOf(Position);
    expect(newPos).to.eql({ line: 0, column: 1 });
  });
  it("incrLine works", () => {
    const newPos = incrLine(initialPos);
    expect(newPos).to.be.instanceOf(Position);
    expect(newPos).to.eql({ line: 1, column: 0 });
  });
  it("fromStr works", () => {
    const inputState = fromStr("");
    expect(inputState).to.be.instanceOf(InputState);
    expect(inputState.lines).to.eql([]);
    expect(inputState.position).to.be.instanceOf(Position);
    expect(inputState.position).to.eql({ line: 0, column: 0 });

    const inputState1 = fromStr("ab");
    expect(inputState1).to.be.instanceOf(InputState);
    expect(inputState1.lines).to.eql(["ab"]);
    expect(inputState1.position).to.be.instanceOf(Position);
    expect(inputState1.position).to.eql({ line: 0, column: 0 });

    const inputState2 = fromStr("a\nb");
    expect(inputState2).to.be.instanceOf(InputState);
    expect(inputState2.lines).to.eql(["a", "b"]);
    expect(inputState2.position).to.be.instanceOf(Position);
    expect(inputState2.position).to.eql({ line: 0, column: 0 });

    const inputState3 = fromStr("a\r\nb");
    expect(inputState3).to.be.instanceOf(InputState);
    expect(inputState3.lines).to.eql(["a", "b"]);
    expect(inputState3.position).to.be.instanceOf(Position);
    expect(inputState3.position).to.eql({ line: 0, column: 0 });
  });
  it("nextChar works", () => {
    const inputStr = "abc\nde";
    let state = fromStr(inputStr);
    let char = "";

    [state, char] = nextChar(state);
    expect(state).to.be.instanceOf(InputState);
    expect(state.lines).to.eql(["abc", "de"]);
    expect(state.position).to.be.instanceOf(Position);
    expect(state.position).to.eql({ line: 0, column: 1 });
    expect(char).to.be.instanceOf(Some);
    expect(char.val).to.equal("a");

    [state, char] = nextChar(state);
    expect(state).to.be.instanceOf(InputState);
    expect(state.lines).to.eql(["abc", "de"]);
    expect(state.position).to.be.instanceOf(Position);
    expect(state.position).to.eql({ line: 0, column: 2 });
    expect(char).to.be.instanceOf(Some);
    expect(char.val).to.equal("b");

    [state, char] = nextChar(state);
    expect(state).to.be.instanceOf(InputState);
    expect(state.lines).to.eql(["abc", "de"]);
    expect(state.position).to.be.instanceOf(Position);
    expect(state.position).to.eql({ line: 0, column: 3 });
    expect(char).to.be.instanceOf(Some);
    expect(char.val).to.equal("c");

    [state, char] = nextChar(state);
    expect(state).to.be.instanceOf(InputState);
    expect(state.lines).to.eql(["abc", "de"]);
    expect(state.position).to.be.instanceOf(Position);
    expect(state.position).to.eql({ line: 1, column: 0 });
    expect(char).to.be.instanceOf(Some);
    expect(char.val).to.equal("\n");

    [state, char] = nextChar(state);
    expect(state).to.be.instanceOf(InputState);
    expect(state.lines).to.eql(["abc", "de"]);
    expect(state.position).to.be.instanceOf(Position);
    expect(state.position).to.eql({ line: 1, column: 1 });
    expect(char).to.be.instanceOf(Some);
    expect(char.val).to.equal("d");

    [state, char] = nextChar(state);
    expect(state).to.be.instanceOf(InputState);
    expect(state.lines).to.eql(["abc", "de"]);
    expect(state.position).to.be.instanceOf(Position);
    expect(state.position).to.eql({ line: 1, column: 2 });
    expect(char).to.be.instanceOf(Some);
    expect(char.val).to.equal("e");

    [state, char] = nextChar(state);
    expect(state).to.be.instanceOf(InputState);
    expect(state.lines).to.eql(["abc", "de"]);
    expect(state.position).to.be.instanceOf(Position);
    expect(state.position).to.eql({ line: 2, column: 0 });
    expect(char).to.be.instanceOf(Some);
    expect(char.val).to.equal("\n");

    [state, char] = nextChar(state);
    expect(state).to.be.instanceOf(InputState);
    expect(state.lines).to.eql(["abc", "de"]);
    expect(state.position).to.be.instanceOf(Position);
    expect(state.position).to.eql({ line: 2, column: 0 });
    expect(char).to.be.instanceOf(None);
  });
  it("readAllChars works", () => {
    const result1 = readAllChars(fromStr(""));
    //=> []
    const result2 = readAllChars(fromStr("a"));
    //=> ['a'; '\010']
    const result3 = readAllChars(fromStr("ab"));
    //=> ['a'; 'b'; '\010']
    const result4 = readAllChars(fromStr("a\nb"));
    //=> ['a'; '\010'; 'b'; '\010']

    expect(result1).to.eql([]);
    expect(result2).to.eql(["a", "\n"]);
    expect(result3).to.eql(["a", "b", "\n"]);
    expect(result4).to.eql(["a", "\n", "b", "\n"]);
  });
});
