import type {ReactNode} from 'react';
import {useLocation} from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import BrowserOnly from '@docusaurus/BrowserOnly';
import {useColorMode} from '@docusaurus/theme-common';
import Giscus from '@giscus/react';
import type {AvailableLanguage} from '@giscus/react';
import type {Theme} from '@giscus/react';
import clsx from 'clsx';
import styles from './styles.module.css';

type GiscusSiteConfig = {
  readonly repo?: string;
  readonly repoId?: string;
  readonly category?: string;
  readonly categoryId?: string;
  readonly lang?: string;
};

/** Default English UI; env can override. */
function giscusLangFromConfig(raw: string | undefined): AvailableLanguage {
  const t = (raw ?? 'en').trim().toLowerCase();
  return (t || 'en') as AvailableLanguage;
}

function giscusThemeForMode(colorMode: 'light' | 'dark'): Theme {
  return colorMode === 'dark' ? 'noborder_dark' : 'noborder_light';
}

export type GiscusCommentsVariant = 'default' | 'doc';

export type GiscusCommentsProps = {
  readonly variant?: GiscusCommentsVariant;
};

function normalizePath(path: string): string {
  const t = path.replace(/\/$/, '');
  return t === '' ? '/' : t;
}

/** True when the route is the site home (not /docs, /scenarios, etc.). */
export function isSiteHomePage(pathname: string, baseUrl: string): boolean {
  return normalizePath(pathname) === normalizePath(baseUrl);
}

function GiscusInner({variant = 'default'}: GiscusCommentsProps): ReactNode {
  const location = useLocation();
  const {siteConfig} = useDocusaurusContext();
  const {colorMode} = useColorMode();
  const giscus = (siteConfig.customFields?.giscus ?? {}) as GiscusSiteConfig;

  const repo = giscus.repo ?? 'whatsper/texterdocs';
  const repoId = giscus.repoId?.trim() ?? '';
  const category = giscus.category ?? 'Comments';
  const categoryId = giscus.categoryId?.trim() ?? '';
  const giscusLang = giscusLangFromConfig(giscus.lang);

  if (variant !== 'doc' && isSiteHomePage(location.pathname, siteConfig.baseUrl)) {
    return null;
  }

  const sectionClass = clsx(styles.section, variant === 'doc' && styles.sectionDoc);
  const cardClass = clsx(
    styles.card,
    variant === 'doc' ? styles.cardDoc : styles.cardDefault,
  );

  if (!repoId || !categoryId) {
    if (process.env.NODE_ENV === 'development') {
      const missingCard = (
        <div className={clsx(styles.card, variant === 'doc' ? styles.cardDoc : styles.cardDefault, styles.missingConfig)}>
          <p className={styles.missingTitle}>Giscus is not configured yet</p>
          <p className={styles.missingBody}>
            Add <code>GISCUS_REPO_ID</code> and <code>GISCUS_CATEGORY_ID</code> to your environment (see{' '}
            <a href="https://giscus.app" target="_blank" rel="noreferrer noopener">
              giscus.app
            </a>
            ). Enable <strong>Discussions</strong> on the repo and install the{' '}
            <a href="https://github.com/apps/giscus" target="_blank" rel="noreferrer noopener">
              giscus GitHub App
            </a>
            .
          </p>
        </div>
      );
      if (variant === 'doc') {
        return (
          <section className={sectionClass} aria-label="Giscus setup">
            {missingCard}
          </section>
        );
      }
      return (
        <div className={clsx(styles.fullBleedWrap, 'margin-bottom--lg')}>
          <section className={sectionClass} aria-label="Giscus setup">
            <div className="container">{missingCard}</div>
          </section>
        </div>
      );
    }
    return null;
  }

  const [repoOwner, repoName] = repo.split('/');
  if (!repoOwner || !repoName) {
    return null;
  }

  const iframeTheme = giscusThemeForMode(colorMode);

  const body = (
    <div className={cardClass}>
      <header className={clsx(styles.cardHeader, styles.cardHeaderHe)} dir="rtl" lang="he">
        <h2 className={styles.eyebrow} id="giscus-section-title">
          דיון
        </h2>
        <p className={styles.lead}>
          שתפו דוגמאות נוספות, שאלות או הצעות לשיפור התיעוד ביחס לעמוד זה.
        </p>
        <p className={styles.loginNote}>דורש התחברות עם GitHub.</p>
      </header>
      <div className={clsx(styles.embed, styles.embedGiscus)}>
        <Giscus
          id="texterdocs-giscus"
          repo={`${repoOwner}/${repoName}` as `${string}/${string}`}
          repoId={repoId}
          category={category}
          categoryId={categoryId}
          mapping="pathname"
          strict="0"
          reactionsEnabled="1"
          emitMetadata="0"
          inputPosition="bottom"
          theme={iframeTheme}
          lang={giscusLang}
          loading="lazy"
        />
      </div>
    </div>
  );

  if (variant === 'doc') {
    return (
      <section className={sectionClass} aria-labelledby="giscus-section-title">
        {body}
      </section>
    );
  }

  return (
    <div className={clsx(styles.fullBleedWrap, 'margin-bottom--lg')}>
      <section className={sectionClass} aria-labelledby="giscus-section-title">
        <div className="container">{body}</div>
      </section>
    </div>
  );
}

export default function GiscusComments({variant = 'default'}: GiscusCommentsProps): ReactNode {
  return (
    <BrowserOnly fallback={null}>
      {() => <GiscusInner variant={variant} />}
    </BrowserOnly>
  );
}
