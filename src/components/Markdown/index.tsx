import {useMemo, type ReactNode} from 'react';
import ReactMarkdown from 'react-markdown';
import type {Components, Options} from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

/**
 * Converts single newlines inside each paragraph block to Markdown hard breaks
 * (two spaces before LF). Enables line-wrapping for multi-line snippets without
 * depending on remark-breaks.
 */
export function toHardBreakMarkdown(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((block) => block.replace(/([^\n])\n/g, '$1  \n'))
    .join('\n\n');
}

export interface MarkdownProps {
  children: string;
  /** Extra component overrides; merged over defaults, caller wins. */
  components?: Components;
  /** Extra remark plugins; GFM is always included. */
  remarkPlugins?: Options['remarkPlugins'];
  /** Convert single `\n` to hard line breaks before rendering. Default: false. */
  hardBreaks?: boolean;
  /** Class applied to the default internal-link-aware `<a>` renderer. */
  linkClassName?: string;
  /** Invoked when an internal link is clicked (e.g. to close a panel). */
  onLinkClick?: () => void;
}

/**
 * Shared Markdown renderer. Handles GFM and routes internal links through
 * `@docusaurus/Link` so they behave like the rest of the site. All component
 * overrides passed in `components` win over the default `<a>` renderer.
 */
export default function Markdown({
  children,
  components,
  remarkPlugins,
  hardBreaks = false,
  linkClassName,
  onLinkClick,
}: MarkdownProps): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  const siteBase = `${siteConfig.url}${siteConfig.baseUrl}`.replace(/\/$/, '');

  const mergedComponents = useMemo<Components>(() => {
    const defaults: Components = {
      a: ({href, children: linkChildren, ...linkProps}) => {
        if (!href) return <a {...linkProps}>{linkChildren}</a>;
        const isInternal =
          href.startsWith('/') || href.startsWith(siteBase);
        if (isInternal) {
          const to = href.startsWith(siteBase)
            ? href.slice(siteBase.length) || '/'
            : href;
          return (
            <Link to={to} className={linkClassName} onClick={onLinkClick}>
              {linkChildren}
            </Link>
          );
        }
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClassName}
            {...linkProps}>
            {linkChildren}
          </a>
        );
      },
    };
    return {...defaults, ...components};
  }, [siteBase, components, linkClassName, onLinkClick]);

  const plugins = useMemo(
    () => [remarkGfm, ...(remarkPlugins ?? [])],
    [remarkPlugins],
  );

  const body = hardBreaks ? toHardBreakMarkdown(children) : children;

  return (
    <ReactMarkdown remarkPlugins={plugins} components={mergedComponents}>
      {body}
    </ReactMarkdown>
  );
}
