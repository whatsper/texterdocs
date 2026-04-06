import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  description: ReactNode;
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
  },
  {
    title: 'Data Injection',
    description: (
      <>
        Learn how to inject dynamic data from chats, CRM, bot state, and messages
        into your bot flows using providers and transformers.
      </>
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
  },
];

function Feature({title, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center padding-horiz--md" style={{paddingTop: '2rem'}}>
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
