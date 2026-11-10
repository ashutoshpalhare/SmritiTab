import { describe, expect, it } from "vitest";
import {
  CalcError,
  evaluateExpression,
  formatCalculatorValue,
} from "../calc";

describe("calculator", () => {
  it("respects operator precedence", () => {
    expect(evaluateExpression("2+3*4")).toBe(14);
    expect(evaluateExpression("(2+3)*4")).toBe(20);
    expect(evaluateExpression("2^3^2")).toBe(512);
  });

  it("handles negative numbers and unary minus", () => {
    expect(evaluateExpression("-5+3")).toBe(-2);
    expect(evaluateExpression("-(4-10)")).toBe(6);
    expect(evaluateExpression("3*-2")).toBe(-6);
  });

  it("performs real division and modulo", () => {
    expect(evaluateExpression("10/4")).toBe(2.5);
    expect(evaluateExpression("10/5")).toBe(2);
    expect(evaluateExpression("7%3")).toBe(1);
  });

  it("supports decimals", () => {
    expect(evaluateExpression("0.1+0.2")).toBeCloseTo(0.3, 10);
    expect(evaluateExpression("1.5*2")).toBe(3);
  });

  it("substitutes the previous answer and constants", () => {
    expect(evaluateExpression("ans+1", 5)).toBe(6);
    expect(evaluateExpression("pi")).toBeCloseTo(Math.PI, 10);
  });

  it("rejects malformed input without throwing a non-CalcError", () => {
    expect(() => evaluateExpression("2+")).toThrow(CalcError);
    expect(() => evaluateExpression("2++")).toThrow(CalcError);
    expect(() => evaluateExpression("(2+3")).toThrow(CalcError);
    expect(() => evaluateExpression("2/0")).toThrow(CalcError);
    expect(() => evaluateExpression("")).toThrow(CalcError);
  });

  it("accepts unicode operators", () => {
    expect(evaluateExpression("6×7")).toBe(42);
    expect(evaluateExpression("8÷2")).toBe(4);
  });

  it("formats results without floating point noise", () => {
    expect(formatCalculatorValue(0.1 + 0.2)).toBe("0.3");
    expect(formatCalculatorValue(42)).toBe("42");
    expect(formatCalculatorValue(Number.NaN)).toBe("Error");
  });
});
