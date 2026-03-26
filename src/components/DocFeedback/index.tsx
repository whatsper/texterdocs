import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type TransitionEvent,
} from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import toast, {Toaster} from 'react-hot-toast';
import styles from './styles.module.css';

/** English values for n8n / Asana mapping; labels are Hebrew in the UI. */
const CATEGORIES = [
  {value: 'fix', label: 'מידע שגוי או לא מעודכן'},
  {value: 'addition', label: 'תוכן חסר'},
  {value: 'unclear', label: 'הסבר לא ברור'},
  {value: 'typo', label: 'שגיאת כתיב או ניסוח'},
  {value: 'broken link', label: 'קישור שבור או תקלה'},
  {value: 'improvement', label: 'הצעה לשיפור'},
  {value: 'other', label: 'אחר'},
] as const;

type Scope = 'page' | 'general';

type ScreenshotPayload = {
  mime: string;
  base64: string;
};

function getSectionLabelFromHash(): string {
  if (!ExecutionEnvironment.canUseDOM) {
    return '';
  }
  const hash = window.location.hash.replace(/^#/, '');
  if (!hash) {
    return '';
  }
  try {
    const id = decodeURIComponent(hash);
    const el = document.getElementById(id);
    if (el) {
      return el.textContent?.trim().slice(0, 200) ?? '';
    }
  } catch {
    return '';
  }
  return '';
}

async function resizeImageFile(file: File): Promise<ScreenshotPayload | null> {
  const maxW = 1400;
  const maxBytes = 1_800_000;

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) {
    return null;
  }

  const scale = Math.min(1, maxW / bitmap.width);
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    return null;
  }
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  let quality = 0.88;
  let blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/jpeg', quality),
  );

  while (blob && blob.size > maxBytes && quality > 0.45) {
    quality -= 0.1;
    blob = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/jpeg', quality),
    );
  }

  if (!blob) {
    return null;
  }

  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const r = reader.result;
      if (typeof r !== 'string') {
        reject(new Error('read'));
        return;
      }
      const comma = r.indexOf(',');
      resolve(comma >= 0 ? r.slice(comma + 1) : r);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob!);
  });

  return {mime: 'image/jpeg', base64};
}

export default function DocFeedback(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  const webhookUrl =
    (siteConfig.customFields?.feedbackWebhookUrl as string | undefined) ?? '';

  /** Overlay in DOM (kept mounted until close transition finishes). */
  const [layerMounted, setLayerMounted] = useState(false);
  /** Enter/leave: slide + fade (see styles .panelOpen / .backdropOpen). */
  const [layerOpen, setLayerOpen] = useState(false);
  const closeRequestedRef = useRef(false);
  const prevLayerMountedRef = useRef(false);
  const [category, setCategory] = useState<string>('');
  const [scope, setScope] = useState<Scope>('page');
  const [pageUrl, setPageUrl] = useState('');
  const [pageTitle, setPageTitle] = useState('');
  const [sectionLabel, setSectionLabel] = useState('');
  const [message, setMessage] = useState('');
  const [submitterName, setSubmitterName] = useState('');
  const [contact, setContact] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [screenshot, setScreenshot] = useState<ScreenshotPayload | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pasteTextareaRef = useRef<HTMLTextAreaElement>(null);

  const PASTE_PLACEHOLDER =
    'לחצו כאן והדביקו צילום מסך';

  /** Not read-only: browsers only show a blinking caret in editable fields. */
  const onPasteShotKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey || e.metaKey || e.altKey) {
      return;
    }
    if (e.key === 'Tab' || e.key === 'Escape') {
      return;
    }
    if (
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight' ||
      e.key === 'ArrowUp' ||
      e.key === 'ArrowDown' ||
      e.key === 'Home' ||
      e.key === 'End' ||
      e.key === 'PageUp' ||
      e.key === 'PageDown'
    ) {
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      return;
    }
    if (e.key.length === 1) {
      e.preventDefault();
    }
  };

  const refreshPageContext = useCallback(() => {
    if (!ExecutionEnvironment.canUseDOM) {
      return;
    }
    setPageUrl(window.location.href);
    setPageTitle(document.title);
    setSectionLabel(getSectionLabelFromHash());
  }, []);

  useEffect(() => {
    if (!layerMounted) {
      return;
    }
    const id = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setLayerOpen(true));
    });
    return () => window.cancelAnimationFrame(id);
  }, [layerMounted]);

  useEffect(() => {
    if (layerMounted) {
      refreshPageContext();
      setError(null);
    }
  }, [layerMounted, refreshPageContext]);

  useEffect(() => {
    if (layerMounted && !prevLayerMountedRef.current) {
      setCategory('');
      setMessage('');
    }
    prevLayerMountedRef.current = layerMounted;
  }, [layerMounted]);

  useEffect(() => {
    if (!layerMounted || scope !== 'page') {
      return;
    }
    const onHash = () => refreshPageContext();
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [layerMounted, scope, refreshPageContext]);

  const requestCloseOverlay = useCallback(() => {
    closeRequestedRef.current = true;
    setLayerOpen(false);
  }, []);

  const onPanelTransitionEnd = useCallback((e: TransitionEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) {
      return;
    }
    if (!/transform/i.test(e.propertyName)) {
      return;
    }
    if (!closeRequestedRef.current) {
      return;
    }
    closeRequestedRef.current = false;
    setLayerMounted(false);
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const contextSummary = useMemo(() => {
    if (scope === 'general') {
      return 'כללי (לא קשור לעמוד מסוים)';
    }
    return (
      <>
        <div>
          <strong>כתובת:</strong> {pageUrl || 'אין'}
        </div>
        {sectionLabel ? (
          <div style={{marginTop: '0.35rem'}}>
            <strong>מקטע:</strong> {sectionLabel}
          </div>
        ) : null}
      </>
    );
  }, [scope, pageUrl, sectionLabel]);

  const clearScreenshot = () => {
    setScreenshot(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      return;
    }
    clearScreenshot();
    const payload = await resizeImageFile(file);
    if (payload) {
      setScreenshot(payload);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handlePasteScreenshot = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const item = Array.from(e.clipboardData.items).find((i) =>
      i.type.startsWith('image/'),
    );
    if (!item) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    const file = item.getAsFile();
    if (!file) {
      return;
    }
    void (async () => {
      clearScreenshot();
      const payload = await resizeImageFile(file);
      if (payload) {
        setScreenshot(payload);
        setPreviewUrl(URL.createObjectURL(file));
      }
    })();
  };

  const onPasteShotInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    if (el.value !== '') {
      el.value = '';
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webhookUrl || honeypot) {
      return;
    }
    if (!category) {
      setError('נא לבחור קטגוריה.');
      return;
    }
    const trimmed = message.trim();
    if (!trimmed) {
      setError('נא להזין הודעה.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const body = {
      category,
      scope,
      pageUrl: scope === 'page' ? pageUrl : '',
      pageTitle: scope === 'page' ? pageTitle : '',
      sectionLabel: scope === 'page' ? sectionLabel : '',
      message: trimmed,
      submitterName: submitterName.trim(),
      contact: contact.trim(),
      screenshot,
      website: honeypot,
      submittedAt: new Date().toISOString(),
    };

    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body),
        mode: 'cors',
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      setCategory('');
      setMessage('');
      setSubmitterName('');
      setContact('');
      clearScreenshot();
      toast.success('הטופס נשלח בהצלחה', {
        duration: 4000,
        style: {direction: 'rtl'},
      });
      requestCloseOverlay();
    } catch {
      setError('לא ניתן לשלוח את המשוב. נסו שוב מאוחר יותר.');
    } finally {
      setSubmitting(false);
    }
  };

  const hasWebhook = Boolean(webhookUrl);
  const canSend =
    hasWebhook && category !== '' && message.trim().length > 0;

  return (
    <>
      <Toaster
        position="top-center"
        containerStyle={{top: 20, zIndex: 650}}
        toastOptions={{
          duration: 4000,
          style: {direction: 'rtl'},
        }}
      />
      <button
        type="button"
        className={styles.fab}
        onClick={() => setLayerMounted(true)}
        aria-haspopup="dialog"
        aria-expanded={layerMounted && layerOpen}>
        שלח משוב
      </button>

      {layerMounted ? (
        <>
          <button
            type="button"
            className={`${styles.backdrop} ${layerOpen ? styles.backdropOpen : ''}`}
            aria-label="סגירת חלון המשוב"
            onClick={requestCloseOverlay}
          />
          <div
            className={`${styles.panel} ${layerOpen ? styles.panelOpen : ''}`}
            dir="rtl"
            lang="he"
            role="dialog"
            aria-modal="true"
            aria-labelledby="doc-feedback-title"
            onTransitionEnd={onPanelTransitionEnd}>
            <div className={styles.panelHeader}>
              <div>
                <h2 id="doc-feedback-title">עזרו לנו לשפר את הדוקומנטציה</h2>
                <small style={{display: 'block', marginTop: '0.35rem'}}>
                  לדיוק במיקום בדף, השתמשו בסולמית ליד הכותרת (#) כדי לכלול את
                  המקטע בכתובת.
                </small>
                {!hasWebhook ? (
                  <p className={styles.configNotice}>
                    שליחת משוב אינה זמינה בסביבה זו (חסרה כתובת שרת). בהרצה
                    מקומית הגדירו את משתנה הסביבה FEEDBACK_WEBHOOK_URL.
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={requestCloseOverlay}
                aria-label="סגור">
                ×
              </button>
            </div>

            <form className={styles.panelBody} onSubmit={onSubmit}>
              <input
                className={styles.honeypot}
                tabIndex={-1}
                autoComplete="off"
                name="website"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                aria-hidden="true"
              />

              <div className={styles.field}>
                <label htmlFor="df-category">קטגוריה</label>
                <select
                  id="df-category"
                  className={styles.select}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}>
                  <option value="" disabled>
                    בחרו קטגוריה
                  </option>
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <span id="df-scope-label">רלוונטי ל</span>
                <div
                  className={styles.scopeRow}
                  role="group"
                  aria-labelledby="df-scope-label"
                  style={{marginTop: '0.35rem'}}>
                  <label>
                    <input
                      type="radio"
                      name="scope"
                      checked={scope === 'page'}
                      onChange={() => {
                        setScope('page');
                        refreshPageContext();
                      }}
                    />
                    עמוד זה
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="scope"
                      checked={scope === 'general'}
                      onChange={() => setScope('general')}
                    />
                    כללי
                  </label>
                </div>
                <div className={styles.contextBox}>{contextSummary}</div>
              </div>

              <div className={styles.field}>
                <label id="df-shot-label">צילום מסך (אופציונלי)</label>
                <div className={styles.rowActions}>
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={() => fileInputRef.current?.click()}>
                    העלאת תמונה
                  </button>
                  {screenshot ? (
                    <button
                      type="button"
                      className={styles.secondaryBtn}
                      onClick={clearScreenshot}>
                      הסרה
                    </button>
                  ) : null}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{display: 'none'}}
                  onChange={onPickFile}
                  aria-hidden
                />
                {previewUrl ? (
                  <div className={styles.pastePreviewBox}>
                    <img
                      className={styles.pastePreviewImg}
                      src={previewUrl}
                      alt="תצוגה מקדימה של צילום המסך"
                    />
                  </div>
                ) : (
                  <textarea
                    ref={pasteTextareaRef}
                    id="df-paste-shot"
                    className={styles.pasteTextarea}
                    defaultValue=""
                    onKeyDown={onPasteShotKeyDown}
                    onInput={onPasteShotInput}
                    onPaste={handlePasteScreenshot}
                    placeholder={PASTE_PLACEHOLDER}
                    rows={4}
                    spellCheck={false}
                    autoComplete="off"
                    aria-labelledby="df-shot-label"
                  />
                )}
                <small>
                  אפשר גם להעלות קובץ עם הכפתור &quot;העלאת תמונה&quot;. אחרי
                  הדבקה מוצגת תצוגה מקדימה; &quot;הסרה&quot; מחזירה לשדה הזה.
                </small>
              </div>

              <div className={styles.field}>
                <label htmlFor="df-msg">הודעה</label>
                <textarea
                  id="df-msg"
                  className={styles.textarea}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="מה נוכל לשנות או להוסיף?"
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="df-name">שם (אופציונלי)</label>
                <input
                  id="df-name"
                  className={styles.textInput}
                  type="text"
                  value={submitterName}
                  onChange={(e) => setSubmitterName(e.target.value)}
                  autoComplete="name"
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="df-contact">יצירת קשר (אופציונלי)</label>
                <input
                  id="df-contact"
                  className={styles.textInput}
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="אימייל אם תרצו מענה"
                  autoComplete="email"
                />
              </div>

              {error ? <p className={styles.errorText}>{error}</p> : null}

              <div className={styles.submitRow}>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={submitting || !canSend}>
                  {submitting ? 'שולח...' : 'שליחת משוב'}
                </button>
              </div>
            </form>
          </div>
        </>
      ) : null}
    </>
  );
}
