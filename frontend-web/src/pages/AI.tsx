import { useEffect, useRef, useState } from "react";
import {
  Check,
  Microphone,
  PaperPlaneTilt,
  ShieldCheck,
  SpeakerHigh,
  StopCircle,
  X,
} from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { playLocalizedSpeech, stopLocalizedSpeech } from "../utils/speech";

type Proposal = {
  id: number;
  action_type: string;
  risk: string;
  status: string;
  summary: string;
  fields: Record<string, unknown>;
  expires_at: string;
};
type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  action?: Proposal;
  language?: string;
  typing?: boolean;
};
type MemoryMessage = { role: "user" | "assistant"; content: string };
type AssistantData = {
  reply?: string;
  detected_language?: string;
  memory_messages?: MemoryMessage[];
  conversation_summary?: string;
  action?: Proposal;
};
const clean = (text: string) =>
  text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s*/gm, "")
    .replace(/\*\*|__|`/g, "")
    .replace(/^\s*[-*•]\s+/gm, "")
    .trim();
const id = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export default function AI() {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: id(),
      role: "assistant",
      content: "Namaste. Tell me what you need help with in your society.",
      language: "en-IN",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState("");
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [memory, setMemory] = useState<MemoryMessage[]>([]);
  const [summary, setSummary] = useState("");
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, thinking, recording]);
  useEffect(
    () => () => {
      stream.current?.getTracks().forEach((track) => track.stop());
      stopLocalizedSpeech();
    },
    [],
  );

  async function speak(text: string, language = "en-IN", messageId?: string) {
    stopLocalizedSpeech();
    setSpeakingId(messageId ?? null);
    setError("");
    try {
      await playLocalizedSpeech(
        clean(text),
        language.startsWith("mr")
          ? "mr"
          : language.startsWith("hi")
            ? "hi"
            : "en",
        {
          onEnd: () => setSpeakingId(null),
          onError: (message) => {
            setSpeakingId(null);
            setError(message);
          },
        },
      );
    } catch (error) {
      setSpeakingId(null);
      setError(
        error instanceof Error ? error.message : "Speech playback failed.",
      );
    }
  }

  async function reveal(data: AssistantData, transcript?: string) {
    const reply = clean(data.reply || "");
    const language = data.detected_language || "en-IN";
    const messageId = id();
    setMemory(data.memory_messages || []);
    setSummary(data.conversation_summary || "");
    setMessages((current) => [
      ...current,
      ...(transcript
        ? [{ id: id(), role: "user" as const, content: transcript }]
        : []),
      { id: messageId, role: "assistant", content: "", language, typing: true },
    ]);
    setThinking(false);
    const step = reply.length > 500 ? 5 : reply.length > 220 ? 3 : 2;
    await new Promise<void>((resolve) => {
      let position = 0;
      const timer = window.setInterval(() => {
        position = Math.min(reply.length, position + step);
        setMessages((current) =>
          current.map((message) =>
            message.id === messageId
              ? { ...message, content: reply.slice(0, position) }
              : message,
          ),
        );
        if (position >= reply.length) {
          window.clearInterval(timer);
          resolve();
        }
      }, 16);
    });
    setMessages((current) =>
      current.map((message) =>
        message.id === messageId
          ? { ...message, action: data.action, typing: false }
          : message,
      ),
    );
    void speak(reply, language, messageId);
  }

  async function send(event?: React.FormEvent) {
    event?.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    stopLocalizedSpeech();
    setSpeakingId(null);
    setMessages((current) => [
      ...current,
      { id: id(), role: "user", content: text },
    ]);
    setInput("");
    setBusy(true);
    setThinking(true);
    setError("");
    try {
      await reveal(
        (
          await api.post("/ai/chat", {
            message: text,
            language: "auto",
            history: memory,
            conversation_summary: summary || null,
          })
        ).data,
      );
    } catch (error: any) {
      setThinking(false);
      setError(
        error?.response?.data?.detail ||
          "The assistant could not be reached. Use a manual service or try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function startRecording() {
    if (recording || busy) return;
    stopLocalizedSpeech();
    setSpeakingId(null);
    setError("");
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = media;
      chunks.current = [];
      const next = new MediaRecorder(media);
      recorder.current = next;
      next.ondataavailable = (event) => {
        if (event.data.size) chunks.current.push(event.data);
      };
      next.onstop = async () => {
        media.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunks.current, {
          type: next.mimeType || "audio/webm",
        });
        if (blob.size < 1000) {
          setError(
            "Almost no microphone audio was captured. Hold the button and speak clearly.",
          );
          return;
        }
        setBusy(true);
        setThinking(true);
        try {
          const form = new FormData();
          form.append("audio", blob, "request.webm");
          form.append("language", "unknown");
          form.append("history", JSON.stringify(memory));
          form.append("conversation_summary", summary);
          const data = (await api.post("/ai/voice", form, { timeout: 45000 }))
            .data;
          await reveal(data, data.input_transcript);
        } catch (error: any) {
          setThinking(false);
          setError(
            error?.response?.data?.detail ||
              "The recording could not be understood. Try again or type the request.",
          );
        } finally {
          setBusy(false);
        }
      };
      next.start();
      setRecording(true);
    } catch {
      setError(
        "Microphone access is blocked. Allow it in the browser or type your request.",
      );
    }
  }
  function stopRecording() {
    if (recorder.current?.state === "recording") recorder.current.stop();
    setRecording(false);
  }

  async function decide(
    action: Proposal,
    decision: "confirm" | "cancel",
    language = "en-IN",
  ) {
    setBusy(true);
    setThinking(true);
    setError("");
    try {
      const data = (
        await api.post(`/ai/actions/${action.id}/${decision}`, undefined, {
          params: { language },
        })
      ).data;
      let reply = clean(data.message);
      if (
        decision === "confirm" &&
        action.action_type === "pay_outstanding_dues"
      ) {
        if (action.fields.demo) {
          const result = (await api.post("/bills/payments/demo")).data;
          reply = `${reply} Demo payment of ₹${result.amount.toLocaleString("en-IN")} completed.`;
        } else {
          const order = (await api.post("/bills/payment-order")).data;
          await loadRazorpay();
          await new Promise((resolve, reject) =>
            new (window as any).Razorpay({
              key: order.key_id,
              amount: order.amount_paise,
              currency: "INR",
              name: "Panchayat AI",
              description: "Combined maintenance dues",
              order_id: order.order_id,
              handler: async (response: any) =>
                resolve(
                  (await api.post("/bills/payments/verify", response)).data,
                ),
              modal: {
                ondismiss: () => reject(new Error("Payment cancelled")),
              },
            }).open(),
          );
          reply = `${reply} Payment completed securely.`;
        }
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["bills"] }),
          queryClient.invalidateQueries({ queryKey: ["bills", "home"] }),
        ]);
      }
      await reveal({ reply, detected_language: language });
    } catch (error: any) {
      setThinking(false);
      setError(
        error?.response?.data?.detail ||
          error?.message ||
          "The action could not be completed.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="assistant-page">
      <header className="assistant-top">
        <div>
          <span className="assistant-mark">
            <Microphone size={21} weight="fill" />
          </span>
          <div>
            <strong>Ask Panchayat</strong>
            <small>
              <ShieldCheck size={13} />
              Society-only assistant
            </small>
          </div>
        </div>
        <p>Speak or type in the language that feels natural.</p>
      </header>
      <div className="assistant-chat">
        <div className="message-list" aria-live="polite">
          {messages.map((message) => (
            <article className={`message ${message.role}`} key={message.id}>
              <div className="message-label">
                {message.role === "user" ? "You" : "Panchayat AI"}
              </div>
              <div className="message-bubble">
                <p>
                  {message.content}
                  {message.typing ? (
                    <span className="typing-caret" aria-hidden="true" />
                  ) : null}
                </p>
                {message.role === "assistant" &&
                message.content &&
                !message.typing ? (
                  <button
                    className="listen-button"
                    type="button"
                    onClick={() =>
                      speakingId === message.id
                        ? (stopLocalizedSpeech(), setSpeakingId(null))
                        : speak(message.content, message.language, message.id)
                    }
                  >
                    {speakingId === message.id ? (
                      <>
                        <StopCircle size={16} />
                        Stop
                      </>
                    ) : (
                      <>
                        <SpeakerHigh size={16} />
                        Listen
                      </>
                    )}
                  </button>
                ) : null}
                {message.action?.status === "pending" ? (
                  <div className="proposal">
                    <strong>Ready to do this</strong>
                    <p>{message.action.summary}</p>
                    <div className="form-actions">
                      <button
                        className="button small"
                        disabled={busy}
                        onClick={() =>
                          decide(message.action!, "confirm", message.language)
                        }
                      >
                        <Check size={15} />
                        Confirm action
                      </button>
                      <button
                        className="button ghost small"
                        disabled={busy}
                        onClick={() =>
                          decide(message.action!, "cancel", message.language)
                        }
                      >
                        <X size={15} />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </article>
          ))}
          {thinking ? (
            <p className="thinking-text">
              Thinking<span>....</span>
            </p>
          ) : null}
          <div ref={endRef} />
        </div>
        <div className="composer">
          {error ? (
            <div className="feedback error" role="alert">
              {error}
            </div>
          ) : null}
          {recording ? (
            <div className="recording-panel">
              <div className="live-wave" aria-hidden="true">
                {Array.from({ length: 18 }, (_, index) => (
                  <i
                    key={index}
                    style={{ animationDelay: `${index * -0.055}s` }}
                  />
                ))}
              </div>
              <div>
                <strong>Listening</strong>
                <span>Tap stop when you finish</span>
              </div>
              <button
                className="record-stop"
                type="button"
                aria-label="Stop recording"
                onClick={stopRecording}
              >
                <StopCircle size={24} weight="fill" />
              </button>
            </div>
          ) : (
            <form className="composer-form" onSubmit={send}>
              <button
                className="composer-mic"
                type="button"
                aria-label="Start voice recording"
                disabled={busy}
                onClick={startRecording}
              >
                <Microphone size={21} weight="fill" />
              </button>
              <label className="sr-only" htmlFor="assistant-message">
                Message Panchayat AI
              </label>
              <textarea
                id="assistant-message"
                rows={1}
                placeholder="Ask about maintenance, complaints, visitors, or notices"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void send();
                  }
                }}
              />
              <button
                className="composer-send"
                type="submit"
                aria-label="Send message"
                disabled={busy || !input.trim()}
              >
                <PaperPlaneTilt size={20} weight="fill" />
              </button>
            </form>
          )}
          <p className="composer-note">
            Panchayat AI checks your permissions and asks before taking action.
          </p>
        </div>
      </div>
    </div>
  );
}

async function loadRazorpay() {
  if ((window as any).Razorpay) return;
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Payment checkout could not load"));
    document.body.appendChild(script);
  });
}
