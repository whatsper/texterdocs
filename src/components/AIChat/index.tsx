import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {useLocation} from '@docusaurus/router';
import useBaseUrl from '@docusaurus/useBaseUrl';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import type {Components} from 'react-markdown';
import Link from '@docusaurus/Link';
import Markdown from '@site/src/components/Markdown';
import {Plus, Sparkles, X} from 'lucide-react';
import styles from './styles.module.css';

const PANEL_WIDTH_STORAGE_KEY = 'texterdocs-ai-chat-panel-width-px';
const RESPONSE_ID_STORAGE_KEY = 'texterdocs-ai-chat-response-id';
const TURNS_STORAGE_KEY = 'texterdocs-ai-chat-turns';
const SKIP_NEW_CHAT_CONFIRM_STORAGE_KEY = 'texterdocs-ai-chat-skip-new-chat-confirm';
const PANEL_MIN_WIDTH_PX = 280;
const PANEL_DEFAULT_WIDTH_PX = 560;
const PANEL_MAX_WIDTH_RATIO = 0.75;

const SUGGESTION_POOL = [
  'How do I inject chat or CRM data into a message?',
  'What is the difference between a prompt and a notify?',
  'How do I branch based on a choice the user picked?',
  'How do I run an HTTP request and use the response later?',
  'How do WhatsApp Flows work in bot YAML?',
  'Why won’t my bot accept Flow form submissions?',
  'How do I greet the user with their WhatsApp name?',
  'What is apiVersion v1.1 and do I need it?',
  'Can I nest one data injection inside another?',
  'How do I read the last message or recent messages in YAML?',
  'How do I save a value to use later in the flow?',
  'How do working hours and `checkWorkingTime` work?',
  'What happens with `smart_resolved` after an agent closes the chat?',
  'What should the abandoned-bot sequence avoid doing?',
  'Can `on_failure` go straight to `handoff` or `resolved`?',
  'How do I route on keywords or regex from the last message?',
  'What is `switchNode` used for?',
  'Is `botStateSplit` still OK to use?',
  'How do I send a delayed notify or media?',
  'What is the max delay for notify messages?',
  'How do I send a template with the request node?',
  'How does `sendWebhook` differ from `request`?',
  'How do I mirror all WhatsApp messages to my server?',
  'How do I webhook only incoming customer messages?',
  'How do I forward chats to an external AI bot?',
  'How do I add or remove chat labels?',
  'How do I read or update a Google Sheet via the adapter?',
  'How do I create a lead in the Rapid adapter?',
  'What does migrating `%DATA_CRM%` to the new syntax look like?',
  'How do I build dynamic choice lists from an API?',
];

function panelMaxWidth(): number {
  if (typeof window === 'undefined') return PANEL_DEFAULT_WIDTH_PX;
  return Math.max(PANEL_MIN_WIDTH_PX, Math.floor(window.innerWidth * PANEL_MAX_WIDTH_RATIO));
}

function pickSuggestions(n: number): string[] {
  const pool = [...SUGGESTION_POOL];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n);
}

type SourceLink = {
  title: string;
  section: string;
  url: string;
};

type ChatTurn = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  streaming?: boolean;
  sources?: SourceLink[];
};

/**
 * Every line of a YAML block must start with two extra spaces so support can
 * paste it directly under an existing key in the bot editor. The model is
 * instructed to follow this rule; we enforce it here defensively.
 */
function indentYamlBlocks(md: string): string {
  return md.replace(
    /```ya?ml\s*\n([\s\S]*?)\n```/gi,
    (_match, body: string) => {
      const lines = body.split('\n');
      const firstNonEmpty = lines.find((l) => l.trim().length > 0) ?? '';
      const leading = firstNonEmpty.match(/^ */)?.[0].length ?? 0;
      if (leading >= 2) {
        return '```yaml\n' + body + '\n```';
      }
      const indented = lines.map((l) => (l.length === 0 ? l : '  ' + l)).join('\n');
      return '```yaml\n' + indented + '\n```';
    },
  );
}

function detectRtl(s: string): boolean {
  return /[\u0590-\u05FF\u0600-\u06FF]/.test(s);
}

function newId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function humanizeSegment(segment: string): string {
  return decodeURIComponent(segment).replace(/[-_]+/g, ' ').trim();
}

function pageContextFromPath(pathname: string, baseUrl: string): string | null {
  const baseParts = baseUrl.replace(/\/+$/, '').split('/').filter(Boolean);
  const parts = pathname.replace(/\/+$/, '').split('/').filter(Boolean);
  if (parts.length === 0) return null;

  let rel = parts;
  if (baseParts.length > 0) {
    const sameBase = baseParts.every((p, i) => parts[i] === p);
    if (sameBase) rel = parts.slice(baseParts.length);
  }
  if (rel.length === 0) return null;

  const routeRoot = rel[0];
  const routeLabel = routeRoot === 'docs' ? 'Docs' : routeRoot === 'changelog' ? 'Changelog' : 'Site';
  const contentParts = rel.slice(1).map(humanizeSegment).filter(Boolean);
  if (contentParts.length === 0) return routeLabel;

  const page = contentParts[contentParts.length - 1];
  const section = contentParts.slice(0, -1);
  return section.length > 0 ? `${page} (${routeLabel} > ${section.join(' > ')})` : `${page} (${routeLabel})`;
}

export default function AIChat(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  const location = useLocation();
  const faviconUrl = useBaseUrl('/img/favicon.svg');
  const webhookUrl = (siteConfig.customFields?.aiChatWebhookUrl as string | undefined) ?? '';
  const configured = Boolean(webhookUrl);
  const siteBase = `${siteConfig.url}${siteConfig.baseUrl}`.replace(/\/$/, '');

  // Once opened the panel stays mounted so state survives backdrop close.
  const [panelEverOpened, setPanelEverOpened] = useState(false);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [sending, setSending] = useState(false);
  const [panelWidthPx, setPanelWidthPx] = useState(PANEL_DEFAULT_WIDTH_PX);
  const [suggestions, setSuggestions] = useState<string[]>(() => pickSuggestions(3));
  const [fabCompact, setFabCompact] = useState(false);
  const [showNewChatConfirm, setShowNewChatConfirm] = useState(false);
  const [skipNewChatConfirm, setSkipNewChatConfirm] = useState(false);
  const panelWidthRef = useRef(PANEL_DEFAULT_WIDTH_PX);
  const abortRef = useRef<AbortController | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    panelWidthRef.current = panelWidthPx;
  }, [panelWidthPx]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PANEL_WIDTH_STORAGE_KEY);
      const w = raw ? parseInt(raw, 10) : NaN;
      if (!Number.isNaN(w) && w >= PANEL_MIN_WIDTH_PX) {
        setPanelWidthPx(Math.min(w, panelMaxWidth()));
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(TURNS_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Array<Partial<ChatTurn>>;
      if (!Array.isArray(parsed)) return;
      const restored = parsed
        .filter((t) => (t.role === 'user' || t.role === 'assistant') && typeof t.text === 'string')
        .map((t) => ({
          id: typeof t.id === 'string' && t.id.length > 0 ? t.id : newId(),
          role: t.role as 'user' | 'assistant',
          text: t.text as string,
          streaming: false,
          ...(Array.isArray(t.sources) ? {sources: t.sources as SourceLink[]} : {}),
        }));
      if (restored.length > 0) {
        setTurns(restored);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      setSkipNewChatConfirm(sessionStorage.getItem(SKIP_NEW_CHAT_CONFIRM_STORAGE_KEY) === '1');
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const onWinResize = () => {
      setPanelWidthPx((w) => Math.max(PANEL_MIN_WIDTH_PX, Math.min(w, panelMaxWidth())));
    };
    window.addEventListener('resize', onWinResize);
    return () => window.removeEventListener('resize', onWinResize);
  }, []);

  const persistPanelWidth = useCallback((w: number) => {
    try {
      localStorage.setItem(PANEL_WIDTH_STORAGE_KEY, String(w));
    } catch {
      /* ignore */
    }
  }, []);

  const onResizePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const el = e.currentTarget;
    const pointerId = e.pointerId;
    el.setPointerCapture(pointerId);
    const startX = e.clientX;
    const startW = panelWidthRef.current;
    let lastW = startW;

    const move = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return;
      // Handle is on the LEFT edge of a right-docked panel — drag left = grow.
      lastW = Math.max(
        PANEL_MIN_WIDTH_PX,
        Math.min(startW - (ev.clientX - startX), panelMaxWidth()),
      );
      setPanelWidthPx(lastW);
    };

    const end = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
      try {
        el.releasePointerCapture(pointerId);
      } catch {
        /* ignore */
      }
      persistPanelWidth(lastW);
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
  }, [persistPanelWidth]);

  const openPanel = useCallback(() => {
    setPanelEverOpened(true);
    if (turns.length === 0) {
      setSuggestions(pickSuggestions(3));
    }
    requestAnimationFrame(() => requestAnimationFrame(() => setOpen(true)));
  }, [turns.length]);

  const closePanel = useCallback(() => {
    setOpen(false);
    // State preserved — panel hides via CSS, DOM stays mounted.
  }, []);

  const onFabSizeToggle = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setFabCompact((v) => !v);
  }, []);

  const clearChat = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setSending(false);
    setTurns([]);
    setSuggestions(pickSuggestions(3));
    try {
      sessionStorage.removeItem(RESPONSE_ID_STORAGE_KEY);
      sessionStorage.removeItem(TURNS_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const onNewChat = useCallback(() => {
    if (skipNewChatConfirm) {
      clearChat();
      return;
    }
    setShowNewChatConfirm(true);
  }, [clearChat, skipNewChatConfirm]);

  const onConfirmNewChat = useCallback(() => {
    setShowNewChatConfirm(false);
    try {
      if (skipNewChatConfirm) {
        sessionStorage.setItem(SKIP_NEW_CHAT_CONFIRM_STORAGE_KEY, '1');
      } else {
        sessionStorage.removeItem(SKIP_NEW_CHAT_CONFIRM_STORAGE_KEY);
      }
    } catch {
      /* ignore */
    }
    clearChat();
  }, [clearChat, skipNewChatConfirm]);

  const onCancelNewChat = useCallback(() => {
    setShowNewChatConfirm(false);
    // Reset checkbox to persisted value so ticking then cancelling doesn't leak state.
    try {
      setSkipNewChatConfirm(
        sessionStorage.getItem(SKIP_NEW_CHAT_CONFIRM_STORAGE_KEY) === '1',
      );
    } catch {
      /* ignore */
    }
  }, []);

  const onSkipNewChatConfirmChange = useCallback((checked: boolean) => {
    setSkipNewChatConfirm(checked);
  }, []);

  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [turns]);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      }),
    );
  }, [open]);

  useEffect(() => {
    if (!showNewChatConfirm) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancelNewChat();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showNewChatConfirm, onCancelNewChat]);

  useEffect(() => {
    try {
      if (turns.length === 0) {
        sessionStorage.removeItem(TURNS_STORAGE_KEY);
        return;
      }
      const toPersist = turns.map((t) => ({
        id: t.id,
        role: t.role,
        text: t.text,
        ...(t.sources ? {sources: t.sources} : {}),
      }));
      sessionStorage.setItem(TURNS_STORAGE_KEY, JSON.stringify(toPersist));
    } catch {
      /* ignore */
    }
  }, [turns]);

  const send = useCallback(
    async (rawQuery?: string) => {
      const query = (rawQuery ?? input).trim();
      if (!query || sending || !configured) return;

      let previousResponseId: string | null = null;
      try {
        previousResponseId = sessionStorage.getItem(RESPONSE_ID_STORAGE_KEY);
      } catch {
        /* ignore */
      }

      // Short conversation history (pre-current-turn) for the server-side
      // query rewriter to handle follow-ups like "explain in Hebrew".
      const history = turns
        .filter((t) => !t.streaming && t.text)
        .slice(-8)
        .map((t) => ({role: t.role, content: t.text}));

      const userTurn: ChatTurn = {id: newId(), role: 'user', text: query};
      const botTurn: ChatTurn = {
        id: newId(),
        role: 'assistant',
        text: '',
        streaming: true,
      };
      setTurns((prev) => [...prev, userTurn, botTurn]);
      setInput('');
      setSending(true);

      const ctrl = new AbortController();
      abortRef.current = ctrl;

      try {
        const res = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            message: query,
            previous_response_id: previousResponseId,
            history,
          }),
          signal: ctrl.signal,
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const payload = (await res.json()) as {
          text?: string;
          sources?: SourceLink[];
          response_id?: string;
          error?: string;
        };
        if (payload.error) throw new Error(payload.error);

        const accum = payload.text ?? '';
        const sources: SourceLink[] = Array.isArray(payload.sources)
          ? payload.sources
          : [];
        if (payload.response_id) {
          try {
            sessionStorage.setItem(RESPONSE_ID_STORAGE_KEY, payload.response_id);
          } catch {
            /* ignore */
          }
        }

        // Typewriter reveal: drip-feed text for a smooth appearance
        if (accum.length > 0 && !ctrl.signal.aborted) {
          const totalLen = accum.length;
          const targetFrames = Math.max(25, Math.min(80, Math.round(totalLen / 6)));
          const charsPerFrame = Math.max(1, Math.ceil(totalLen / targetFrames));

          await new Promise<void>((resolve) => {
            let pos = 0;
            const step = () => {
              if (ctrl.signal.aborted) {
                resolve();
                return;
              }
              pos = Math.min(pos + charsPerFrame, totalLen);
              setTurns((prev) =>
                prev.map((t) =>
                  t.id === botTurn.id ? {...t, text: accum.slice(0, pos)} : t,
                ),
              );
              if (pos >= totalLen) resolve();
              else requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
          });
        }

        // Validate source URLs — only keep links that match the docs site pattern
        const validSources = sources.filter((s) => {
          if (!s.url) return false;
          const path = s.url.startsWith(siteBase) ? s.url.slice(siteBase.length) : s.url;
          return path.startsWith('/docs/') || path.startsWith('/scenarios');
        });

        setTurns((prev) =>
          prev.map((t) =>
            t.id === botTurn.id
              ? {...t, streaming: false, sources: validSources.length > 0 ? validSources : undefined}
              : t,
          ),
        );
      } catch (err) {
        if ((err as {name?: string})?.name === 'AbortError') {
          setTurns((prev) => prev.filter((t) => t.id !== botTurn.id));
        } else {
          setTurns((prev) =>
            prev.map((t) =>
              t.id === botTurn.id
                ? {
                    ...t,
                    streaming: false,
                    text:
                      (t.text ?? '') +
                      (t.text
                        ? '\n\n_[Error finishing the response.]_'
                        : '_Sorry — something went wrong reaching the AI. Please try again._'),
                  }
                : t,
            ),
          );
          console.error('[AIChat] stream error:', err);
        }
      } finally {
        if (abortRef.current === ctrl) abortRef.current = null;
        setSending(false);
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            inputRef.current?.focus();
          }),
        );
      }
    },
    [configured, input, sending, webhookUrl],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        void send();
      }
    },
    [send],
  );

  const askAboutCurrentPage = useCallback(() => {
    let pageName = pageContextFromPath(location.pathname, siteConfig.baseUrl) ?? 'this page';
    if (typeof document !== 'undefined') {
      const titlePrefix = document.title.split('|')[0]?.trim();
      if (titlePrefix && pageName !== 'this page') {
        pageName = `${titlePrefix} [${pageName}]`;
      } else if (titlePrefix) {
        pageName = titlePrefix;
      }
    }
    const prompt = `I'm reading the "${pageName}" page. Can you summarize what this page is for, the key YAML points to follow, and common mistakes to avoid?`;
    setInput(prompt);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const el = inputRef.current;
        if (!el) return;
        el.focus();
        const end = prompt.length;
        el.setSelectionRange(end, end);
        el.scrollTop = el.scrollHeight;
        el.scrollLeft = el.scrollWidth;
      }),
    );
  }, [location.pathname, siteConfig.baseUrl]);

  const markdownComponents = useMemo<Components>(
    () => ({
      pre: ({children, ...props}) => (
        <pre dir="ltr" {...props}>
          {children}
        </pre>
      ),
      code: ({children, ...props}) => (
        <code dir="ltr" {...props}>
          {children}
        </code>
      ),
      table: ({children, ...props}) => (
        <div className={styles.tableWrap}>
          <table {...props}>{children}</table>
        </div>
      ),
    }),
    [],
  );

  return (
    <>
      {!open ? (
        <div className={styles.fabDock}>
          <button
            type="button"
            className={`${styles.fab} ${fabCompact ? styles.fabCompact : ''}`}
            onClick={openPanel}
            aria-haspopup="dialog"
            aria-expanded={open}
            title={
              fabCompact
                ? 'Open Texter Docs AI chat'
                : 'Ask the Texter Docs AI'
            }>
            <Sparkles size={16} strokeWidth={2.1} aria-hidden="true" />
            <span className={styles.fabLabel}>Ask AI</span>
          </button>
          <button
            type="button"
            className={styles.fabCompactToggle}
            aria-label={fabCompact ? 'Expand Ask AI button' : 'Minimize Ask AI button to icon'}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onFabSizeToggle}>
            <Plus
              size={16}
              strokeWidth={2.6}
              aria-hidden="true"
              className={`${styles.fabToggleIcon} ${fabCompact ? styles.fabToggleIconCompact : ''}`}
            />
          </button>
        </div>
      ) : null}

      {panelEverOpened ? (
        <>
          <button
            type="button"
            className={`${styles.backdrop} ${open ? styles.backdropOpen : ''}`}
            aria-label="Close AI chat"
            tabIndex={open ? 0 : -1}
            onClick={closePanel}
          />
          <div
            className={`${styles.panel} ${open ? styles.panelOpen : styles.panelHidden}`}
            style={{width: panelWidthPx}}
            role="dialog"
            aria-modal={open}
            aria-hidden={!open}
            aria-labelledby="ai-chat-title">
            <div
              className={styles.resizeHandle}
              onPointerDown={onResizePointerDown}
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize chat panel"
              tabIndex={0}
              onKeyDown={(e) => {
                const step = 16;
                if (e.key === 'ArrowLeft') {
                  e.preventDefault();
                  setPanelWidthPx((w) => {
                    const n = Math.min(panelMaxWidth(), w + step);
                    persistPanelWidth(n);
                    return n;
                  });
                } else if (e.key === 'ArrowRight') {
                  e.preventDefault();
                  setPanelWidthPx((w) => {
                    const n = Math.max(PANEL_MIN_WIDTH_PX, w - step);
                    persistPanelWidth(n);
                    return n;
                  });
                }
              }}
            />
            <div className={styles.header}>
              <div className={styles.headerTitle}>
                <img src={faviconUrl} alt="" className={styles.headerLogo} aria-hidden="true" />
                <div>
                  <h2 id="ai-chat-title">Texter Docs AI</h2>
                  <small>Answers from the Texter documentation.</small>
                  {!configured ? (
                    <p className={styles.configNotice}>
                      AI chat is not configured in this environment. Set
                      AI_CHAT_WEBHOOK_URL.
                    </p>
                  ) : null}
                </div>
              </div>
              <div className={styles.headerActions}>
                {turns.length > 0 ? (
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={onNewChat}
                    aria-label="Start a new chat">
                    New chat
                  </button>
                ) : null}
                <button
                  type="button"
                  className={styles.closeBtn}
                  onClick={closePanel}
                  aria-label="Close">
                  <X size={16} strokeWidth={2.3} aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className={styles.body} ref={bodyRef}>
              {turns.length === 0 ? (
                <div className={styles.empty}>
                  <p>Ask anything about Texter's YAML bot configuration.</p>
                  <button
                    type="button"
                    className={styles.pageSuggestionBtn}
                    onClick={askAboutCurrentPage}
                    disabled={!configured || sending}>
                    Ask about this page
                  </button>
                  <ul className={styles.suggestions}>
                    {suggestions.map((s) => (
                      <li key={s}>
                        <button
                          type="button"
                          className={styles.suggestionBtn}
                          onClick={() => void send(s)}
                          disabled={!configured || sending}>
                          {s}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                turns.map((t) => {
                  const rtl = detectRtl(t.text || '');
                  const rendered =
                    t.role === 'assistant' ? indentYamlBlocks(t.text) : t.text;
                  return (
                    <div
                      key={t.id}
                      className={`${styles.turn} ${
                        t.role === 'user' ? styles.turnUser : styles.turnBot
                      }`}>
                      {t.role === 'assistant' ? (
                        <div
                          className={styles.markdown}
                          dir={rtl ? 'rtl' : 'ltr'}>
                          {t.streaming && !t.text.trim() ? (
                            <span className={styles.typingIndicator}>
                              <span className={styles.typingDots}>
                                <span className={styles.typingDot} />
                                <span className={styles.typingDot} />
                                <span className={styles.typingDot} />
                              </span>
                            </span>
                          ) : (
                            <Markdown
                              onLinkClick={closePanel}
                              components={markdownComponents}>
                              {rendered || '...'}
                            </Markdown>
                          )}
                          {t.streaming && t.text.trim().length > 0 ? (
                            <span className={styles.cursor} aria-hidden="true" />
                          ) : null}
                          {!t.streaming && t.sources && t.sources.length > 0 ? (
                            <div className={styles.sourceLinks}>
                              {t.sources.map((src) => {
                                const to = src.url.startsWith(siteBase)
                                  ? src.url.slice(siteBase.length) || '/'
                                  : src.url;
                                const label = src.section
                                  ? `${src.title} › ${src.section}`
                                  : src.title;
                                return (
                                  <Link
                                    key={src.url}
                                    to={to}
                                    className={styles.sourceBtn}
                                    onClick={closePanel}>
                                    {label}
                                  </Link>
                                );
                              })}
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <div className={styles.userText} dir={rtl ? 'rtl' : 'ltr'}>{t.text}</div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className={styles.composer}>
              <textarea
                className={styles.input}
                ref={inputRef}
                dir="auto"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Ask about YAML, adapters, functions…"
                rows={2}
                disabled={!configured || sending}
              />
              <button
                type="button"
                className={styles.sendBtn}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => void send()}
                disabled={!configured || sending || input.trim().length === 0}>
                {sending ? '…' : 'Send'}
              </button>
            </div>

            {showNewChatConfirm ? (
              <>
                <button
                  type="button"
                  className={styles.confirmBackdrop}
                  aria-label="Close new chat confirmation"
                  onClick={onCancelNewChat}
                />
                <div className={styles.confirmDialog} role="dialog" aria-modal="true">
                  <h3>Start a fresh chat?</h3>
                  <p>
                    This will clear your current conversation.
                  </p>
                  <label className={styles.confirmCheckbox}>
                    <input
                      type="checkbox"
                      checked={skipNewChatConfirm}
                      onChange={(e) => onSkipNewChatConfirmChange(e.target.checked)}
                    />
                    Don&apos;t ask me again
                  </label>
                  <div className={styles.confirmActions}>
                    <button type="button" className={styles.secondaryBtn} onClick={onCancelNewChat}>
                      Cancel
                    </button>
                    <button type="button" className={styles.sendBtn} onClick={onConfirmNewChat}>
                      Start new chat
                    </button>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </>
      ) : null}
    </>
  );
}
