import type {ComponentProps, ReactNode} from 'react';
import {useLocation} from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import clsx from 'clsx';
import Layout from '@theme-original/Layout';
import BrowserOnly from '@docusaurus/BrowserOnly';
import DocFeedback from '@site/src/components/DocFeedback';
import GiscusComments, {isSiteHomePage} from '@site/src/components/GiscusComments';
import styles from './styles.module.css';

type LayoutProps = ComponentProps<typeof Layout>;

/**
 * Giscus on every page except home. Doc routes: align with `main` (sidebar offset), then same
 * container + col--9 grid as the doc article.
 */
function GiscusBlock(): ReactNode {
  const location = useLocation();
  const {siteConfig} = useDocusaurusContext();
  const base = siteConfig.baseUrl.replace(/\/$/, '');
  const changelogPrefix = `${base}/changelog`;
  const pathNorm = location.pathname.replace(/\/$/, '') || '/';

  if (isSiteHomePage(location.pathname, siteConfig.baseUrl)) {
    return null;
  }

  /* Blog / changelog — no giscus (noise vs doc pages) */
  if (pathNorm === changelogPrefix || pathNorm.startsWith(`${changelogPrefix}/`)) {
    return null;
  }

  const isDocsRoute = location.pathname.startsWith(`${base}/docs`);

  /* Remount giscus on client navigation so pathname mapping loads the correct thread */
  const inner = (
    <GiscusComments key={location.pathname} variant={isDocsRoute ? 'doc' : 'default'} />
  );

  if (isDocsRoute) {
    return (
      <div className={styles.docGiscusShell}>
        <div className={clsx('container', 'margin-bottom--lg')}>
          <div className="row">
            <div className={clsx('col', 'col--9')}>{inner}</div>
          </div>
        </div>
      </div>
    );
  }

  /* Non-doc: full-bleed gradient lives inside GiscusComments */
  return inner;
}

export default function LayoutWrapper(props: LayoutProps): ReactNode {
  const {children, ...rest} = props;

  return (
    <>
      <Layout {...rest}>
        <>
          {children}
          <GiscusBlock />
        </>
      </Layout>
      <BrowserOnly fallback={null}>
        {() => <DocFeedback />}
      </BrowserOnly>
    </>
  );
}
