/**
 * A small, dependency free expression evaluator used by the Calculator app.
 *
 * Supports: + - * / % ^, parentheses, unary minus, decimals, `ans`, `pi` and `e`.
 * `%` is a modulo operator (not a percentage sign) which keeps the behaviour
 * predictable; the UI labels it accordingly.
 */

export class CalcError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CalcError";
  }
}

type Token =
  | { type: "number"; value: number }
  | { type: "operator"; value: "+" | "-" | "*" | "/" | "%" | "^" }
  | { type: "lparen" }
  | { type: "rparen" }
  | { type: "ident"; value: string };

const OPERATORS = new Set(["+", "-", "*", "/", "%", "^"]);

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;
  const source = input
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-")
    .replace(/\s+/g, "");

  while (index < source.length) {
    const char = source[index];

    if (/[0-9.]/.test(char)) {
      let numberText = "";
      let dotCount = 0;
      while (index < source.length && /[0-9.]/.test(source[index])) {
        if (source[index] === ".") {
          dotCount += 1;
          if (dotCount > 1) throw new CalcError("Malformed number");
        }
        numberText += source[index];
        index += 1;
      }
      const value = Number(numberText);
      if (!Number.isFinite(value)) throw new CalcError("Malformed number");
      tokens.push({ type: "number", value });
      continue;
    }

    if (/[a-z]/i.test(char)) {
      let ident = "";
      while (index < source.length && /[a-z]/i.test(source[index])) {
        ident += source[index];
        index += 1;
      }
      tokens.push({ type: "ident", value: ident.toLowerCase() });
      continue;
    }

    if (char === "(") {
      tokens.push({ type: "lparen" });
      index += 1;
      continue;
    }

    if (char === ")") {
      tokens.push({ type: "rparen" });
      index += 1;
      continue;
    }

    if (OPERATORS.has(char)) {
      tokens.push({
        type: "operator",
        value: char as "+" | "-" | "*" | "/" | "%" | "^",
      });
      index += 1;
      continue;
    }

    throw new CalcError(`Unexpected character "${char}"`);
  }

  return tokens;
}

class Parser {
  private position = 0;

  constructor(
    private readonly tokens: Token[],
    private readonly ans: number,
  ) {}

  private peek(): Token | undefined {
    return this.tokens[this.position];
  }

  private next(): Token | undefined {
    const token = this.tokens[this.position];
    this.position += 1;
    return token;
  }

  parse(): number {
    const value = this.parseExpression();
    if (this.position < this.tokens.length) {
      throw new CalcError("Unexpected end of expression");
    }
    if (!Number.isFinite(value)) throw new CalcError("Result is not a finite number");
    return value;
  }

  private parseExpression(): number {
    let left = this.parseTerm();
    for (;;) {
      const token = this.peek();
      if (token?.type === "operator" && (token.value === "+" || token.value === "-")) {
        this.next();
        const right = this.parseTerm();
        left = token.value === "+" ? left + right : left - right;
      } else {
        return left;
      }
    }
  }

  private parseTerm(): number {
    let left = this.parseFactor();
    for (;;) {
      const token = this.peek();
      if (
        token?.type === "operator" &&
        (token.value === "*" || token.value === "/" || token.value === "%")
      ) {
        this.next();
        const right = this.parseFactor();
        if (token.value === "*") left *= right;
        else if (token.value === "/") {
          if (right === 0) throw new CalcError("Cannot divide by zero");
          left /= right;
        } else {
          if (right === 0) throw new CalcError("Cannot divide by zero");
          left %= right;
        }
      } else {
        return left;
      }
    }
  }

  private parseFactor(): number {
    const base = this.parseUnary();
    const token = this.peek();
    if (token?.type === "operator" && token.value === "^") {
      this.next();
      const exponent = this.parseFactor();
      const result = base ** exponent;
      if (!Number.isFinite(result)) throw new CalcError("Result is too large");
      return result;
    }
    return base;
  }

  private parseUnary(): number {
    const token = this.peek();
    if (token?.type === "operator" && (token.value === "+" || token.value === "-")) {
      this.next();
      const value = this.parseUnary();
      return token.value === "-" ? -value : value;
    }
    return this.parsePrimary();
  }

  private parsePrimary(): number {
    const token = this.next();
    if (!token) throw new CalcError("Incomplete expression");
    if (token.type === "number") return token.value;
    if (token.type === "lparen") {
      const value = this.parseExpression();
      const closing = this.next();
      if (!closing || closing.type !== "rparen") {
        throw new CalcError("Missing closing parenthesis");
      }
      return value;
    }
    if (token.type === "ident") {
      switch (token.value) {
        case "ans":
          return this.ans;
        case "pi":
          return Math.PI;
        case "e":
          return Math.E;
        default:
          throw new CalcError(`Unknown value "${token.value}"`);
      }
    }
    throw new CalcError("Unexpected token");
  }
}

/** Evaluates an expression, throwing `CalcError` for invalid input. */
export function evaluateExpression(input: string, ans = 0): number {
  const trimmed = input.trim();
  if (!trimmed) throw new CalcError("Enter an expression");
  const tokens = tokenize(trimmed);
  if (tokens.length === 0) throw new CalcError("Enter an expression");
  return new Parser(tokens, ans).parse();
}

/** Formats a result for display (trims floating point noise). */
export function formatCalculatorValue(value: number, maxDecimals = 10): string {
  if (!Number.isFinite(value)) return "Error";
  if (Number.isInteger(value)) return String(value);
  const rounded = Number(value.toFixed(maxDecimals));
  if (Math.abs(rounded) >= 1e16 || (Math.abs(rounded) < 1e-6 && rounded !== 0)) {
    return rounded.toExponential(6);
  }
  return String(rounded);
}
