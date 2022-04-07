const { InputState, Position, None, Some } = require("./types");

/// define an initial position
const initialPos = Position.of(0, 0);

/// increment the column number
const incrCol = (pos) => Position.of(pos.line, pos.column + 1);

/// increment the line number and set the column to 0
const incrLine = (pos) => Position.of(pos.line + 1, 0);

/// Create a new InputState from a string
const fromStr = (str) => {
  if (!str) {
    return InputState.of([], initialPos);
  } else {
    // const separators = ["\r\n", "\n" ]
    const lines = str.replace("\r\n", "\n").split("\n");
    return InputState.of(lines, initialPos);
  }
};

// return the current line
const currentLine = (inputState) => {
  const linePos = inputState.position.line;
  if (linePos < inputState.lines.length) {
    return inputState.lines[linePos];
  } else {
    return "end of file";
  }
};

/// Get the next character from the input, if any
/// else return None. Also return the updated InputState
/// Signature: InputState -> InputState * char option
const nextChar = (input) => {
  const linePos = input.position.line;
  const colPos = input.position.column;
  // three cases
  // 1) if line >= maxLine ->
  //       return EOF
  // 2) if col less than line length ->
  //       return char at colPos, increment colPos
  // 3) if col at line length ->
  //       return NewLine, increment linePos

  if (linePos >= input.lines.length) {
    return [input, None.of()];
  } else {
    const currentL = currentLine(input);
    if (colPos < currentL.length) {
      const char = currentL[colPos];
      const newPos = incrCol(input.position);
      const newState = input.with.position(newPos);
      return [newState, Some.of(char)];
    } else {
      // end of line, so return LF and move to next line
      let char = "\n";
      let newPos = incrLine(input.position);
      let newState = input.with.position(newPos);
      return [newState, Some.of(char)];
    }
  }
};

const readAllChars = (input) => {
  const [remainingInput, charOpt] = nextChar(input);
  if (charOpt instanceof None) {
    return [];
  } else {
    const ch = charOpt.val;
    return [ch, ...readAllChars(remainingInput)];
  }
};

module.exports = {
  initialPos,
  incrCol,
  incrLine,
  fromStr,
  nextChar,
  readAllChars,
};
