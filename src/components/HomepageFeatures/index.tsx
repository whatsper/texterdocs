import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  description: ReactNode;
  icon: ReactNode;
  href: string;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Bot YAML Reference',
    description: (
      <>
        Complete documentation for every node type, function, and configuration
        option available in Texter bot YAML files.
      </>
    ),
    href: '/docs/YAML/Overview',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.iconSvg}>
        <path
          fill="currentColor"
          d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm0 2v14h10V5H7Zm2 3h6v2H9V8Zm0 4h6v2H9v-2Z"
        />
      </svg>
    ),
  },
  {
    title: 'Data Injection',
    description: (
      <>
        Learn how to inject dynamic data from chats, CRM, bot state, and messages
        into your bot flows using providers and transformers.
      </>
    ),
    href: '/docs/YAML/Data Injection/Overview',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.iconSvg}>
        <path
          fill="currentColor"
          d="M12 2a7 7 0 0 1 7 7v2h1a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h1V9a7 7 0 0 1 7-7Zm5 9V9a5 5 0 0 0-10 0v2h10Zm-5 3a2 2 0 0 1 1 3.732V19h-2v-1.268A2 2 0 0 1 12 14Z"
        />
      </svg>
    ),
  },
  {
    title: 'Scenario Marketplace',
    description: (
      <>
        Browse ready-made automation scenarios — copy the JSON directly into Texter and configure for your use
        case in minutes.
      </>
    ),
    href: '/scenarios',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.iconSvg}>
        <path
          fill="currentColor"
          d="M7 2h10a2 2 0 0 1 2 2v5H5V4a2 2 0 0 1 2-2Zm12 9H5v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9Zm-9 3h4v2h-4v-2Zm-2 0v2H7v-2h1Zm9 0v2h-1v-2h1Z"
        />
      </svg>
    ),
  },
];

function Feature({title, description, icon, href}: FeatureItem) {
  return (
    <Link to={href} className={styles.cardLink}>
      <div className={styles.card}>
        <div className={styles.cardIcon}>{icon}</div>
        <Heading as="h3" className={styles.cardTitle}>
          {title}
        </Heading>
        <p className={styles.cardDesc}>{description}</p>
        <div className={styles.cardFooter} aria-hidden="true">
          Learn more <span className={styles.cardArrow}>→</span>
        </div>
      </div>
    </Link>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className={styles.grid}>
          {FeatureList.map((props, idx) => (
            <div key={idx} className={styles.gridItem} style={{animationDelay: `${idx * 70}ms`}}>
              <Feature {...props} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
