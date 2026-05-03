import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={styles.hero}>
      <div className={styles.bg} aria-hidden="true" />
      <div className={clsx('container', styles.heroInner)}>
        <Heading as="h1" className={styles.heroTitle}>
          {siteConfig.title}
        </Heading>
        <p className={styles.heroSubtitle}>{siteConfig.tagline}</p>
        <div className={styles.ctaRow}>
          <Link className={clsx('button button--lg', styles.primaryCta)} to="/docs/YAML/Overview">
            Get Started <span className={styles.ctaArrow} aria-hidden="true">→</span>
          </Link>
          <Link
            className={clsx('button button--outline button--lg', styles.secondaryCta)}
            href="https://apidocs.texterchat.com"
          >
            API Docs <span className={styles.ctaExternal} aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title="Texter Bot Documentation"
      description="Documentation for building WhatsApp chatbots with Texter YAML syntax">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
