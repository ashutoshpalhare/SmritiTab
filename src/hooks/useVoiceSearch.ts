import { useCallback, useEffect, useRef, useState } from "react";

export interface VoiceSearchOptions {
  lang?: string;
  onResult: (transcript: string, isFinal: boolean) => void;
  onError?: (message: string) => void;
}

export interface VoiceSearchController {
  /** True when the browser exposes the Web Speech API. */
  supported: boolean;
  listening: boolean;
  error: string | null;
  start: () => void;
  stop: () => void;
  toggle: () => void;
}

function getRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

function describeError(code: string): string {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return "Microphone permission was denied. Enable it in the site settings.";
    case "no-speech":
      return "No speech was detected. Try again.";
    case "audio-capture":
      return "No microphone was found.";
    case "network":
      return "The speech service could not be reached.";
    case "aborted":
      return "Listening was cancelled.";
    default:
      return `Voice input failed (${code}).`;
  }
}

/**
 * Web Speech API wrapper.
 *
 * Guarantees the listening state can never get stuck: every error path and the
 * `end` event reset the state, and the recognition instance is always aborted
 * on unmount.
 */
export function useVoiceSearch(options: VoiceSearchOptions): VoiceSearchController {
  const { lang = "en-US", onResult, onError } = options;
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const optionsRef = useRef({ onResult, onError });
  optionsRef.current = { onResult, onError };

  const supported = getRecognitionConstructor() !== null;

  const teardown = useCallback(() => {
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    if (!recognition) return;
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;
    recognition.onstart = null;
    try {
      recognition.abort();
    } catch {
      /* already stopped */
    }
  }, []);

  const stop = useCallback(() => {
    const recognition = recognitionRef.current;
    if (recognition) {
      try {
        recognition.stop();
      } catch {
        /* not started */
      }
    }
    teardown();
    setListening(false);
  }, [teardown]);

  const start = useCallback(() => {
    setError(null);
    if (recognitionRef.current) {
      setError("Voice input is already running.");
      return;
    }
    const Recognition = getRecognitionConstructor();
    if (!Recognition) {
      const message = "Voice search is not supported in this browser.";
      setError(message);
      optionsRef.current.onError?.(message);
      return;
    }

    let recognition: SpeechRecognition;
    try {
      recognition = new Recognition();
    } catch {
      const message = "Voice input could not be started.";
      setError(message);
      optionsRef.current.onError?.(message);
      return;
    }

    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setListening(true);

    recognition.onresult = (event) => {
      let transcript = "";
      let isFinal = false;
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        transcript += result[0]?.transcript ?? "";
        if (result.isFinal) isFinal = true;
      }
      optionsRef.current.onResult(transcript.trim(), isFinal);
    };

    recognition.onerror = (event) => {
      const message = describeError(event.error);
      setError(message);
      setListening(false);
      optionsRef.current.onError?.(message);
      teardown();
    };

    recognition.onend = () => {
      // Always released — prevents the UI getting stuck in a listening state.
      setListening(false);
      teardown();
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      setListening(true);
    } catch {
      teardown();
      setListening(false);
      const message = "Voice input could not be started.";
      setError(message);
      optionsRef.current.onError?.(message);
    }
  }, [lang, teardown]);

  const toggle = useCallback(() => {
    if (recognitionRef.current) stop();
    else start();
  }, [start, stop]);

  useEffect(() => teardown, [teardown]);

  return { supported, listening, error, start, stop, toggle };
}
