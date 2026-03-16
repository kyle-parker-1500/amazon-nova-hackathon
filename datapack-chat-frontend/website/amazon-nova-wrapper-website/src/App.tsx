import { useState, useRef, useEffect } from "react";
import LandingPage from "./LandingPage";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import JSZip from "jszip";

const INITIAL_CONVERSATIONS: never[] = [];
let nextId = 1;

// ── Types ──────────────────────────────────────────────────────────────────────
interface FileEntry { path: string; content: string; }
interface FilesPayload { type: "files"; description: string; files: FileEntry[]; }
type MessageContent = string | FilesPayload;

// ── Helpers ────────────────────────────────────────────────────────────────────
function splitIntroAndFiles(raw: string): { intro: string; rest: string } {
  const idx = raw.indexOf("```");
  if (idx === -1) return { intro: raw, rest: "" };
  const intro = raw.slice(0, idx).trim();
  const rest = raw.slice(idx).trim();
  return { intro, rest };
}

function parseReply(raw: string): MessageContent {
  try {
    const trimmed = raw.trim();
    if (trimmed.startsWith("{")) {
      const parsed = JSON.parse(trimmed);
      if (parsed.type === "files" && Array.isArray(parsed.files)) return parsed as FilesPayload;
    }
  } catch {}
  return raw;
}

async function downloadZip(payload: FilesPayload, zipName = "datapack.zip") {
  const zip = new JSZip();
  for (const file of payload.files) zip.file(file.path, file.content);
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = zipName; a.click();
  URL.revokeObjectURL(url);
}

function downloadFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function extractAllFiles(content: string): FileEntry[] {
  const files: FileEntry[] = [];

  // Strategy 1: file path as language tag ```pack.mcmeta
  const tagRegex = /```(\S+\.\S+)\n([\s\S]*?)```/g;
  let match;
  while ((match = tagRegex.exec(content)) !== null) {
    files.push({ path: match[1], content: match[2] });
  }

  if (files.length > 0) return files;

  // Strategy 2: any filename mentioned before a code block
  const lines = content.split("\n");
  let pendingFilename: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // look for a filename pattern anywhere in the line
    const filenameMatch = line.match(/([a-zA-Z0-9_\-/]+\.[a-zA-Z]+)/);
    if (filenameMatch && !line.startsWith("```")) {
      pendingFilename = filenameMatch[1];
    }
    if (line.startsWith("```") && pendingFilename) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      files.push({ path: pendingFilename, content: codeLines.join("\n") });
      pendingFilename = null;
    }
  }

  return files;
}

const SYSTEM_PROMPT = `You are Datapack Copilot, an expert Minecraft datapack assistant powered by Amazon Nova.

RESPONSE STRUCTURE — follow this exactly for every datapack creation request:

Step 1 — REITERATE: Start with a short paragraph (2-3 sentences) that restates what the user asked for in your own words. Explain what the datapack will do. Do NOT skip this step. Do NOT jump straight to code.

Step 2 — FILES: After the reiteration paragraph, provide the datapack files using the correct code block format below.

Example of correct response structure:
---
You want a datapack that gives players a speed boost whenever they enter a nether portal. The datapack will use a repeating command block function that detects players in the portal block and applies the Speed II effect for 5 seconds.

Here are the files:

\`\`\`pack.mcmeta
{ "pack": { "pack_format": 15, "description": "Portal speed boost" } }
\`\`\`

\`\`\`data/speed_boost/functions/tick.mcfunction
execute as @a[nbt={inPortal:1b}] run effect give @s speed 5 1
\`\`\`
---

CRITICAL: When showing file contents in code blocks, you MUST use the file path as the language tag.
This is required for the download feature to work.

CORRECT format:
\`\`\`pack.mcmeta
{ "pack": { "pack_format": 15, "description": "My datapack" } }
\`\`\`

\`\`\`data/minecraft/tags/entity_type/enemy.json
{ "values": [] }
\`\`\`

WRONG format (never do this):
\`\`\`json
{ ... }
\`\`\`

Always use the full relative file path as the code block language tag. Never use "json", "mcfunction", or any generic tag.

IMPORTANT LIMITATIONS:
- Always be upfront about what datapacks can and cannot do.`;

// ── UI Components ──────────────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-mono text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700 transition-colors duration-150">
      {copied ? (
        <><svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg><span className="text-green-400">Copied</span></>
      ) : (
        <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>Copy</>
      )}
    </button>
  );
}

function DownloadButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-mono text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700 transition-colors duration-150">
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
      {label}
    </button>
  );
}

function FilesMessage({ payload }: { payload: FilesPayload }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-300 leading-relaxed">{payload.description}</p>
      <div className="rounded-lg border border-zinc-700 overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 bg-zinc-800 border-b border-zinc-700">
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" /></svg>
            <span className="text-xs font-mono text-zinc-400">{payload.files.length} files</span>
          </div>
          <DownloadButton onClick={() => downloadZip(payload)} label="Download .zip" />
        </div>
        <div className="divide-y divide-zinc-800">
          {payload.files.map((file) => (
            <div key={file.path}>
              <button
                onClick={() => setExpanded(expanded === file.path ? null : file.path)}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-zinc-800/50 transition-colors duration-100 text-left"
              >
                <svg className="w-3 h-3 text-zinc-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <span className="text-xs font-mono text-zinc-400 truncate flex-1">{file.path}</span>
                <span className="text-zinc-700 font-mono text-xs shrink-0">{expanded === file.path ? "▲" : "▼"}</span>
              </button>
              {expanded === file.path && (
                <div className="border-t border-zinc-800">
                  <div className="flex items-center justify-between px-3 py-1 bg-zinc-900">
                    <span className="text-xs font-mono text-zinc-600">{file.path.split(".").pop()}</span>
                    <div className="flex items-center gap-1">
                      <CopyButton text={file.content} />
                      <DownloadButton onClick={() => downloadFile(file.path.split("/").pop()!, file.content)} label="Download" />
                    </div>
                  </div>
                  <SyntaxHighlighter style={oneDark} language={file.path.split(".").pop() ?? "text"} PreTag="div" customStyle={{ margin: 0, borderRadius: 0, fontSize: "12px", maxHeight: "300px" }}>
                    {file.content}
                  </SyntaxHighlighter>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        code({ node, inline, className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || "");
          const codeStr = String(children).replace(/\n$/, "");
          if (!inline && match) {
            return (
              <div className="relative group my-2">
                <div className="flex items-center justify-between bg-zinc-800 border border-zinc-700 rounded-t-lg px-3 py-1.5">
                  <span className="text-xs font-mono text-zinc-500">{match[1]}</span>
                  <div className="flex items-center gap-1">
                    <CopyButton text={codeStr} />
                    <DownloadButton onClick={() => downloadFile(`code.${match[1]}`, codeStr)} label="" />
                  </div>
                </div>
                <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div" customStyle={{ margin: 0, borderRadius: "0 0 8px 8px", border: "1px solid #3f3f46", borderTop: "none", fontSize: "13px" }} {...props}>
                  {codeStr}
                </SyntaxHighlighter>
              </div>
            );
          }
          return <code className="bg-zinc-800 text-indigo-300 px-1.5 py-0.5 rounded text-xs font-mono" {...props}>{children}</code>;
        },
        h1: ({ children }) => <h1 className="text-lg font-bold text-zinc-100 mt-4 mb-2">{children}</h1>,
        h2: ({ children }) => <h2 className="text-base font-bold text-zinc-100 mt-3 mb-1.5">{children}</h2>,
        h3: ({ children }) => <h3 className="text-sm font-bold text-zinc-200 mt-2 mb-1">{children}</h3>,
        ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-2 text-zinc-300">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 my-2 text-zinc-300">{children}</ol>,
        li: ({ children }) => <li className="text-sm leading-relaxed">{children}</li>,
        p: ({ children }) => <p className="text-sm leading-relaxed text-zinc-200 mb-2 last:mb-0">{children}</p>,
        blockquote: ({ children }) => <blockquote className="border-l-2 border-green-500 pl-3 my-2 text-zinc-400 italic">{children}</blockquote>,
        table: ({ children }) => <div className="overflow-x-auto my-2"><table className="text-sm border-collapse w-full">{children}</table></div>,
        th: ({ children }) => <th className="border border-zinc-700 px-3 py-1.5 bg-zinc-800 text-zinc-200 font-mono text-xs text-left">{children}</th>,
        td: ({ children }) => <td className="border border-zinc-700 px-3 py-1.5 text-zinc-300 text-xs">{children}</td>,
        a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-green-400 underline hover:text-green-300">{children}</a>,
        hr: () => <hr className="border-zinc-700 my-3" />,
        strong: ({ children }) => <strong className="font-semibold text-zinc-100">{children}</strong>,
        em: ({ children }) => <em className="italic text-zinc-300">{children}</em>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

function Message({ role, content }: { role: string; content: MessageContent }) {
  const isUser = role === "user";
  const isFiles = typeof content === "object" && content.type === "files";
  const rawText = typeof content === "string" ? content : JSON.stringify(content);
  const allFiles = !isUser && !isFiles && typeof content === "string" ? extractAllFiles(content) : [];

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-md bg-green-600 flex items-center justify-center text-xs font-mono font-bold text-white shrink-0 mt-0.5">DP</div>
      )}
      <div className={`max-w-[75%] ${isUser ? "" : "w-full"}`}>
        <div className={`px-4 py-3 rounded-xl text-sm leading-relaxed ${isUser ? "bg-zinc-800 text-zinc-100 rounded-tr-sm" : "bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-sm"}`}>
          {isUser ? (
            <p className="whitespace-pre-wrap">{rawText}</p>
          ) : isFiles ? (
            <FilesMessage payload={content as FilesPayload} />
          ) : (
            <MarkdownContent content={rawText} />
          )}
        </div>

        {!isUser && !isFiles && (
          <div className="flex items-center gap-1 mt-1 px-1">
            <CopyButton text={rawText} />
            {allFiles.length > 0 && (
              <button
                onClick={() => downloadZip({ type: "files", description: "", files: allFiles })}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-mono text-green-400 hover:text-green-300 hover:bg-zinc-700 border border-green-800 transition-colors duration-150"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Full Project (.zip)
              </button>
            )}
          </div>
        )}
      </div>

      {isUser && (
        <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-mono font-bold text-zinc-300 shrink-0 mt-0.5">K</div>
      )}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3 justify-start">
      <div className="w-7 h-7 rounded-md bg-green-600 flex items-center justify-center text-xs font-mono font-bold text-white shrink-0">DP</div>
      <div className="flex flex-col gap-2">
        {/* ChatGPT-style tool call bubble */}
        <div className="inline-flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-mono text-zinc-300 shadow-sm">
          {/* animated spinner */}
          <svg className="w-3.5 h-3.5 text-purple-400 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <span className="text-zinc-500">calling</span>
          <span className="text-purple-300 font-semibold tracking-wide">amazon_nova</span>
          <span className="flex gap-0.5 ml-0.5">
            {[0, 1, 2].map((i) => (
              <span key={i} className="w-1 h-1 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: `${i * 0.18}s`, animationDuration: "1s" }} />
            ))}
          </span>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ conversations, activeId, onSelect, onNew }: any) {
  return (
    <aside className="w-64 shrink-0 flex flex-col bg-zinc-950 border-r border-zinc-800 h-screen">
      <div className="px-4 py-5 border-b border-zinc-800 flex items-center justify-between">
        <span className="font-mono text-sm font-semibold tracking-widest text-zinc-100 uppercase">Datapack Copilot</span>
        <span className="text-zinc-600 font-mono text-xs">Nova</span>
      </div>
      <div className="px-3 pt-3 pb-2">
        <button onClick={onNew} className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors duration-150 border border-zinc-800 hover:border-zinc-700 font-mono">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          New conversation
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
        <p className="px-2 py-1.5 text-xs font-mono text-zinc-600 uppercase tracking-widest">Recent</p>
        {conversations.map((c: any) => (
          <button key={c.id} onClick={() => onSelect(c.id)} className={`w-full text-left px-3 py-2.5 rounded-md transition-colors duration-150 group ${activeId === c.id ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900"}`}>
            <p className="text-sm font-medium truncate leading-snug">{c.title}</p>
            <p className={`text-xs truncate mt-0.5 font-mono ${activeId === c.id ? "text-zinc-500" : "text-zinc-700 group-hover:text-zinc-600"}`}>{c.timestamp} · {c.preview}</p>
          </button>
        ))}
      </nav>
      <div className="px-4 py-3 border-t border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center text-xs font-mono font-bold text-white shrink-0">K</div>
          <span className="text-xs text-zinc-500 font-mono truncate">kyle@local</span>
        </div>
      </div>
    </aside>
  );
}

function ChatArea({ conversation, onSend, isLoading }: any) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [conversation?.messages, isLoading]);

  const handleSubmit = () => {
    const text = input.trim();
    if (!text || isLoading) return;
    onSend(text);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
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
      <header className="px-6 py-2.5 border-b border-zinc-800 shrink-0">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-xs font-mono text-zinc-500 truncate">{conversation ? conversation.title : "New conversation"}</h1>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto py-6">
        <div className="max-w-3xl mx-auto px-6 space-y-5">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center pt-32">
              <div className="w-12 h-12 rounded-xl bg-green-600/20 border border-green-500/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>
              </div>
              <p className="text-zinc-500 text-sm font-mono">Describe your datapack idea to get started</p>
            </div>
          ) : (
            <>
              {messages.map((msg: any, i: number) => <Message key={i} role={msg.role} content={msg.content} />)}
              {isLoading && <TypingIndicator />}
            </>
          )}
          <div ref={bottomRef} />
        </div>
      </div>
      <div className="py-3 border-t border-zinc-800 shrink-0">
        <div className="max-w-3xl mx-auto px-6">
          <div className="flex items-end gap-2 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 focus-within:border-green-500 transition-colors duration-150">
            <textarea ref={textareaRef} rows={1} value={input} onChange={handleInput} onKeyDown={handleKeyDown} placeholder="Message... (Enter to send, Shift+Enter for newline)" className="flex-1 resize-none bg-transparent text-sm text-zinc-100 placeholder-zinc-600 outline-none leading-relaxed font-sans max-h-40" />
            <button onClick={handleSubmit} disabled={!input.trim() || isLoading} className="shrink-0 w-8 h-8 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors duration-150">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" /></svg>
            </button>
          </div>
          <p className="text-center text-zinc-700 font-mono text-xs mt-2">Datapack Copilot · powered by Amazon Nova</p>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [conversations, setConversations] = useState(INITIAL_CONVERSATIONS);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (showLanding) {
    return <LandingPage onLaunch={() => setShowLanding(false)} />;
  }

  const activeConversation = conversations.find((c: any) => c.id === activeId) ?? null;

  const handleNew = () => {
    const newConv = { id: nextId++, title: "New conversation", preview: "Just started", timestamp: "now", messages: [] };
    setConversations((prev: any) => [newConv, ...prev]);
    setActiveId(newConv.id);
  };

  const handleSend = async (text: string) => {
    let targetId = activeId;

    if (!targetId) {
      const newConv = { id: nextId++, title: text.slice(0, 40) + (text.length > 40 ? "…" : ""), preview: text.slice(0, 30) + "…", timestamp: "now", messages: [] };
      setConversations((prev: any) => [newConv, ...prev]);
      setActiveId(newConv.id);
      targetId = newConv.id;
    }

    const userMessage = { role: "user", content: text };

    setConversations((prev: any) =>
      prev.map((c: any) => {
        if (c.id !== targetId) return c;
        const isNew = c.messages.length === 0;
        return { ...c, title: isNew ? text.slice(0, 40) + (text.length > 40 ? "…" : "") : c.title, preview: text.slice(0, 30), timestamp: "now", messages: [...c.messages, userMessage] };
      })
    );

    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: String(targetId), message: text, systemPrompt: SYSTEM_PROMPT }),
      });
      const data = await res.json();
      const raw: string = data.reply;
      const parsed = parseReply(raw);

      // Always prepend a reiteration bubble from the user's own request,
      // then the model's reply (files/code) as a second message.
      const reiterateIntro = `Got it! You're asking for: **${text}**\n\nHere's the datapack I generated for you:`;
      const newMessages: { role: string; content: MessageContent }[] = [
        { role: "assistant", content: reiterateIntro },
        { role: "assistant", content: parsed },
      ];

      setConversations((prev: any) =>
        prev.map((c: any) => c.id === targetId ? { ...c, messages: [...c.messages, ...newMessages] } : c)
      );
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950 text-zinc-100">
      <Sidebar conversations={conversations} activeId={activeId} onSelect={setActiveId} onNew={handleNew} />
      <ChatArea conversation={activeConversation} onSend={handleSend} isLoading={isLoading} />
    </div>
  );
}
