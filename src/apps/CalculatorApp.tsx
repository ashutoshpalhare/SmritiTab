import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CalcError, evaluateExpression, formatCalculatorValue } from "../lib/calc";
import { cn } from "../lib/utils";
import { Button } from "../components/ui";

const KEYS: Array<{ label: string; value: string; kind?: "action" | "operator" }> = [
  { label: "AC", value: "clear", kind: "action" },
  { label: "(", value: "(" },
  { label: ")", value: ")" },
  { label: "^", value: "^", kind: "operator" },
  { label: "%", value: "%", kind: "operator" },
  { label: "7", value: "7" },
  { label: "8", value: "8" },
  { label: "9", value: "9" },
  { label: "÷", value: "/", kind: "operator" },
  { label: "×", value: "*", kind: "operator" },
  { label: "4", value: "4" },
  { label: "5", value: "5" },
  { label: "6", value: "6" },
  { label: "−", value: "-", kind: "operator" },
  { label: "+", value: "+", kind: "operator" },
  { label: "1", value: "1" },
  { label: "2", value: "2" },
  { label: "3", value: "3" },
  { label: "ans", value: "ans" },
  { label: "⌫", value: "backspace", kind: "action" },
  { label: "0", value: "0" },
  { label: ".", value: "." },
  { label: "=", value: "=", kind: "action" },
];

export function CalculatorApp() {
  const [expression, setExpression] = useState("");
  const [ans, setAns] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const preview = useMemo(() => {
    if (!expression.trim()) return null;
    try {
      return formatCalculatorValue(evaluateExpression(expression, ans));
    } catch {
      return null;
    }
  }, [expression, ans]);

  const evaluate = useCallback(() => {
    if (!expression.trim()) return;
    try {
      const value = evaluateExpression(expression, ans);
      setError(null);
      setAns(value);
      setExpression(formatCalculatorValue(value));
    } catch (caught) {
      setError(
        caught instanceof CalcError ? caught.message : "That expression could not be calculated.",
      );
    }
  }, [ans, expression]);

  const press = useCallback(
    (value: string) => {
      setError(null);
      if (value === "clear") {
        setExpression("");
        return;
      }
      if (value === "backspace") {
        setExpression((prev) => prev.slice(0, -1));
        return;
      }
      if (value === "=") {
        evaluate();
        return;
      }
      setExpression((prev) => {
        const next = prev + value;
        // Only one decimal separator per number.
        const parts = next.split(/[+\-*/%^()]/);
        if (parts.length > 0 && (parts[parts.length - 1].match(/\./g) ?? []).length > 1) {
          return prev;
        }
        return next;
      });
    },
    [evaluate],
  );

  /* Keyboard support — the window has focus, so listen on the element. */
  useEffect(() => {
    const node = inputRef.current;
    if (!node) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key;
      if (/^[0-9.]$/.test(key)) {
        event.preventDefault();
        press(key);
        return;
      }
      if (key === "+" || key === "-" || key === "*" || key === "/" || key === "%" || key === "^") {
        event.preventDefault();
        press(key);
        return;
      }
      if (key === "(" || key === ")") {
        event.preventDefault();
        press(key);
        return;
      }
      if (key === "Enter" || key === "=") {
        event.preventDefault();
        press("=");
        return;
      }
      if (key === "Backspace") {
        event.preventDefault();
        press("backspace");
        return;
      }
      if (key === "Escape") {
        event.preventDefault();
        press("clear");
      }
    };
    node.addEventListener("keydown", onKeyDown);
    return () => node.removeEventListener("keydown", onKeyDown);
  }, [press]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-900/10 p-4 dark:border-white/10">
        <input
          ref={inputRef}
          value={expression}
          onChange={(event) => setExpression(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              evaluate();
            }
          }}
          inputMode="text"
          aria-label="Expression"
          placeholder="Type an expression…"
          className="w-full bg-transparent text-right font-mono text-2xl text-slate-800 outline-none placeholder:text-slate-300 dark:text-slate-100 dark:placeholder:text-slate-600"
        />
        <div className="mt-1 flex items-center justify-between gap-2 text-right">
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            {error ? (
              <span role="alert" className="text-rose-500">
                {error}
              </span>
            ) : (
              "ans = " + formatCalculatorValue(ans)
            )}
          </span>
          <span className="font-mono text-lg text-slate-500 dark:text-slate-300">
            {preview ?? ""}
          </span>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-5 gap-1.5 p-3">
        {KEYS.map((key) => (
          <Button
            key={`${key.label}-${key.value}`}
            onClick={() => press(key.value)}
            className={cn(
              "rounded-xl py-3",
              key.kind === "operator" &&
                "bg-slate-900/5 text-indigo-600 hover:bg-indigo-500/15 dark:bg-white/10 dark:text-indigo-300",
              key.kind === "action" &&
                "bg-rose-500/10 text-rose-500 hover:bg-rose-500/20",
              key.value === "=" &&
                "bg-gradient-to-br from-violet-500 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500",
            )}
          >
            {key.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
