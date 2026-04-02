"use client";

import { useState, useCallback, useRef } from "react";

export type Phase = "idle" | "researching" | "writing" | "done" | "error";

interface StreamState {
  text: string;
  loading: boolean;
  phase: Phase;
  error: string | null;
  done: boolean;
}

export function useStreamingResponse() {
  const [state, setState] = useState<StreamState>({
    text: "",
    loading: false,
    phase: "idle",
    error: null,
    done: false,
  });
  const abortRef = useRef<AbortController | null>(null);

  const stream = useCallback(async (question: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({ text: "", loading: true, phase: "researching", error: null, done: false });

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Request failed" }));
        throw new Error(err.detail || "Failed to generate article");
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") continue;

          try {
            const event = JSON.parse(data);
            if (event.type === "status") {
              setState((prev) => ({ ...prev, phase: event.status }));
            } else if (event.type === "text") {
              accumulated += event.text;
              setState((prev) => ({ ...prev, text: accumulated, phase: "writing" }));
            } else if (event.type === "error") {
              throw new Error(event.error);
            }
          } catch (e) {
            if ((e as Error).message && (e as Error).message !== "Unexpected end of JSON input") {
              throw e;
            }
          }
        }
      }

      setState((prev) => ({ ...prev, loading: false, phase: "done", done: true }));
      return accumulated;
    } catch (e) {
      if ((e as Error).name === "AbortError") return "";
      setState((prev) => ({
        ...prev,
        loading: false,
        phase: "error",
        error: (e as Error).message,
      }));
      return "";
    }
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState({ text: "", loading: false, phase: "idle", error: null, done: false });
  }, []);

  return { ...state, stream, reset };
}
