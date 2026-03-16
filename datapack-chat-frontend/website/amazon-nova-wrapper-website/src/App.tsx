import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

const INITIAL_CONVERSATIONS = [
  {
    id: 1,
    title: "Explain React Server Components",
    preview: "What are RSCs and when...",
    timestamp: "2h ago",
    messages: [],
  },
  {
    id: 2,
    title: "Fix my BFS traversal bug",
    preview: "My adjacency list is...",
    timestamp: "Yesterday",
    messages: [],
  },
  {
    id: 3,
    title: "Tailwind v4 migration",
    preview: "How do I update my...",
    timestamp: "2d ago",
    messages: [],
  },
];

// Detects ```filename.ext ... ``` blocks and returns { filename, lang, code } or null
function extractFile(content: string) {
  const match = content.match(/```(\S+\.\S+)\n([\s\S]*?)```/);
  if (!match) return null;
  const filename = match[1];
  const code = match[2];
  const ext = filename.split(".").pop() ?? "txt";
  return { filename, code, ext };
}

function downloadFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-mono text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700 transition-colors duration-150"
    >
      {copied ? (
        <>
          <svg
            className="w-3 h-3 text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span className="text-green-400">Copied</span>
        </>
      ) : (
        <>
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          Copy
        </>
      )}
    </button>
  );
}

function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        // Code blocks
        code({ node, inline, className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || "");
          const codeStr = String(children).replace(/\n$/, "");
          if (!inline && match) {
            return (
              <div className="relative group my-2">
                <div className="flex items-center justify-between bg-zinc-800 border border-zinc-700 rounded-t-lg px-3 py-1.5">
                  <span className="text-xs font-mono text-zinc-500">
                    {match[1]}
                  </span>
                  <CopyButton text={codeStr} />
                </div>
                <SyntaxHighlighter
                  style={oneDark}
                  language={match[1]}
                  PreTag="div"
                  customStyle={{
                    margin: 0,
                    borderRadius: "0 0 8px 8px",
                    border: "1px solid #3f3f46",
                    borderTop: "none",
                    fontSize: "13px",
                  }}
                  {...props}
                >
                  {codeStr}
                </SyntaxHighlighter>
              </div>
            );
          }
          return (
            <code
              className="bg-zinc-800 text-indigo-300 px-1.5 py-0.5 rounded text-xs font-mono"
              {...props}
            >
              {children}
            </code>
          );
        },
        // Headings
        h1: ({ children }) => (
          <h1 className="text-lg font-bold text-zinc-100 mt-4 mb-2">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-base font-bold text-zinc-100 mt-3 mb-1.5">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-bold text-zinc-200 mt-2 mb-1">
            {children}
          </h3>
        ),
        // Lists
        ul: ({ children }) => (
          <ul className="list-disc list-inside space-y-1 my-2 text-zinc-300">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside space-y-1 my-2 text-zinc-300">
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className="text-sm leading-relaxed">{children}</li>
        ),
        // Paragraphs
        p: ({ children }) => (
          <p className="text-sm leading-relaxed text-zinc-200 mb-2 last:mb-0">
            {children}
          </p>
        ),
        // Blockquote
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-indigo-500 pl-3 my-2 text-zinc-400 italic">
            {children}
          </blockquote>
        ),
        // Tables
        table: ({ children }) => (
          <div className="overflow-x-auto my-2">
            <table className="text-sm border-collapse w-full">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border border-zinc-700 px-3 py-1.5 bg-zinc-800 text-zinc-200 font-mono text-xs text-left">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-zinc-700 px-3 py-1.5 text-zinc-300 text-xs">
            {children}
          </td>
        ),
        // Links
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 underline hover:text-indigo-300"
          >
            {children}
          </a>
        ),
        // HR
        hr: () => <hr className="border-zinc-700 my-3" />,
        // Strong / Em
        strong: ({ children }) => (
          <strong className="font-semibold text-zinc-100">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="italic text-zinc-300">{children}</em>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

function Message({ role, content }: { role: string; content: string }) {
  const isUser = role === "user";
  const fileInfo = !isUser ? extractFile(content) : null;

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center text-xs font-mono font-bold text-white shrink-0 mt-0.5">
          G
        </div>
      )}

      <div className={`max-w-[75%] ${isUser ? "" : "w-full"}`}>
        <div
          className={`px-4 py-3 rounded-xl text-sm leading-relaxed ${
            isUser
              ? "bg-zinc-800 text-zinc-100 rounded-tr-sm"
              : "bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-sm"
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{content}</p>
          ) : (
            <MarkdownContent content={content} />
          )}
        </div>

        {/* Toolbar: copy + file download */}
        {!isUser && (
          <div className="flex items-center gap-1 mt-1 px-1">
            <CopyButton text={content} />
            {fileInfo && (
              <button
                onClick={() => downloadFile(fileInfo.filename, fileInfo.code)}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-mono text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700 transition-colors duration-150"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                {fileInfo.filename}
              </button>
            )}
          </div>
        )}
      </div>

      {isUser && (
        <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-mono font-bold text-zinc-300 shrink-0 mt-0.5">
          K
        </div>
      )}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3 justify-start">
      <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center text-xs font-mono font-bold text-white shrink-0">
        G
      </div>
      <div className="bg-zinc-900 border border-zinc-800 px-4 py-3.5 rounded-xl rounded-tl-sm flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce"
            style={{
              animationDelay: `${i * 0.15}s`,
              animationDuration: "0.9s",
            }}
          />
        ))}
      </div>
    </div>
  );
}

function Sidebar({ conversations, activeId, onSelect, onNew }: any) {
  return (
    <aside className="w-64 shrink-0 flex flex-col bg-zinc-950 border-r border-zinc-800 h-screen">
      <div className="px-4 py-5 border-b border-zinc-800 flex items-center justify-between">
        <span className="font-mono text-sm font-semibold tracking-widest text-zinc-100 uppercase">
          GPT
        </span>
        <span className="text-zinc-600 font-mono text-xs">v1.0</span>
      </div>
      <div className="px-3 pt-3 pb-2">
        <button
          onClick={onNew}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors duration-150 border border-zinc-800 hover:border-zinc-700 font-mono"
        >
          <svg
            className="w-3.5 h-3.5 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          New conversation
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
        <p className="px-2 py-1.5 text-xs font-mono text-zinc-600 uppercase tracking-widest">
          Recent
        </p>
        {conversations.map((c: any) => (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={`w-full text-left px-3 py-2.5 rounded-md transition-colors duration-150 group ${
              activeId === c.id
                ? "bg-zinc-800 text-zinc-100"
                : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900"
            }`}
          >
            <p className="text-sm font-medium truncate leading-snug">
              {c.title}
            </p>
            <p
              className={`text-xs truncate mt-0.5 font-mono ${activeId === c.id ? "text-zinc-500" : "text-zinc-700 group-hover:text-zinc-600"}`}
            >
              {c.timestamp} · {c.preview}
            </p>
          </button>
        ))}
      </nav>
      <div className="px-4 py-3 border-t border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-mono font-bold text-white shrink-0">
            K
          </div>
          <span className="text-xs text-zinc-500 font-mono truncate">
            kyle@local
          </span>
        </div>
      </div>
    </aside>
  );
}

function ChatArea({ conversation, onSend, isLoading }: any) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages, isLoading]);

  const handleSubmit = () => {
    const text = input.trim();
    if (!text || isLoading) return;
    onSend(text);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
  };

  const messages = conversation?.messages ?? [];
  const isEmpty = messages.length === 0 && !isLoading;

  return (
    <div className="flex flex-col flex-1 h-screen bg-zinc-950">
      {/* Header */}
      <header className="px-6 py-2.5 border-b border-zinc-800 shrink-0">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-xs font-mono text-zinc-500 truncate">
            {conversation ? conversation.title : "New conversation"}
          </h1>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-6">
        <div className="max-w-3xl mx-auto px-6 space-y-5">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center pt-32">
              <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-indigo-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
                  />
                </svg>
              </div>
              <p className="text-zinc-500 text-sm font-mono">
                Send a message to get started
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg: any, i: number) => (
                <Message key={i} role={msg.role} content={msg.content} />
              ))}
              {isLoading && <TypingIndicator />}
            </>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="py-3 border-t border-zinc-800 shrink-0">
        <div className="max-w-3xl mx-auto px-6">
          <div className="flex items-end gap-2 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 focus-within:border-indigo-500 transition-colors duration-150">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Message... (Enter to send, Shift+Enter for newline)"
              className="flex-1 resize-none bg-transparent text-sm text-zinc-100 placeholder-zinc-600 outline-none leading-relaxed font-sans max-h-40"
            />
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || isLoading}
              className="shrink-0 w-8 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors duration-150"
            >
              <svg
                className="w-3.5 h-3.5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18"
                />
              </svg>
            </button>
          </div>
          <p className="text-center text-zinc-700 font-mono text-xs mt-2">
            GPT wrapper · responses via your API key
          </p>
        </div>
      </div>
    </div>
  );
}

let nextId = INITIAL_CONVERSATIONS.length + 1;

export default function App() {
  const [conversations, setConversations] = useState(INITIAL_CONVERSATIONS);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const activeConversation =
    conversations.find((c) => c.id === activeId) ?? null;

  const handleNew = () => {
    const newConv = {
      id: nextId++,
      title: "New conversation",
      preview: "Just started",
      timestamp: "now",
      messages: [],
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveId(newConv.id);
  };

  const handleSend = async (text: string) => {
    let targetId = activeId;

    if (!targetId) {
      const newConv = {
        id: nextId++,
        title: text.slice(0, 40) + (text.length > 40 ? "…" : ""),
        preview: text.slice(0, 30) + "…",
        timestamp: "now",
        messages: [],
      };
      setConversations((prev) => [newConv, ...prev]);
      setActiveId(newConv.id);
      targetId = newConv.id;
    }

    const userMessage = { role: "user", content: text };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== targetId) return c;
        const isNew = c.messages.length === 0;
        return {
          ...c,
          title: isNew
            ? text.slice(0, 40) + (text.length > 40 ? "…" : "")
            : c.title,
          preview: text.slice(0, 30),
          timestamp: "now",
          messages: [...c.messages, userMessage],
        };
      }),
    );

    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: String(targetId),
          message: text,
          systemPrompt: "You are a helpful assistant.",
        }),
      });
      const data = await res.json();
      const reply = data.reply;

      setConversations((prev) =>
        prev.map((c) =>
          c.id === targetId
            ? {
                ...c,
                messages: [
                  ...c.messages,
                  { role: "assistant", content: reply },
                ],
              }
            : c,
        ),
      );
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950 text-zinc-100">
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={setActiveId}
        onNew={handleNew}
      />
      <ChatArea
        conversation={activeConversation}
        onSend={handleSend}
        isLoading={isLoading}
      />
    </div>
  );
}
