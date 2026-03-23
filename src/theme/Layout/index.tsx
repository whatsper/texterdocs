import type {ReactNode} from 'react';
import Layout from '@theme-original/Layout';
import BrowserOnly from '@docusaurus/BrowserOnly';
import DocFeedback from '@site/src/components/DocFeedback';

type LayoutProps = {
  readonly children: ReactNode;
  readonly noFooter?: boolean;
  readonly wrapperClassName?: string;
  readonly title?: string;
  readonly description?: string;
};

export default function LayoutWrapper(props: LayoutProps): ReactNode {
  return (
    <>
      <Layout {...props} />
      <BrowserOnly fallback={null}>
        {() => <DocFeedback />}
      </BrowserOnly>
    </>
  );
}
