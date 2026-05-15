import {config as loadEnv} from 'dotenv';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const rootDir = process.cwd();
const dotEnvPath = resolve(rootDir, '.env');
const dotEnvLocalPath = resolve(rootDir, '.env.local');
if (existsSync(dotEnvPath)) {
  loadEnv({path: dotEnvPath});
}
if (existsSync(dotEnvLocalPath)) {
  loadEnv({path: dotEnvLocalPath, override: true});
}

const config: Config = {
  title: 'Texter Docs',
  tagline: 'Build powerful WhatsApp chatbots with YAML',
  favicon: 'img/favicon.svg',

  customFields: {
    aiChatWebhookUrl: process.env.AI_CHAT_WEBHOOK_URL ?? '',
    templateImportProxyUrl: process.env.TEMPLATE_IMPORT_PROXY_URL ?? '',
    unsubscribePhonesWebhookUrl: process.env.UNSUBSCRIBE_PHONES_WEBHOOK_URL ?? '',
    giscus: {
      repo: process.env.GISCUS_REPO?.trim() || 'whatsper/texterdocs',
      repoId: process.env.GISCUS_REPO_ID?.trim() ?? '',
      category: process.env.GISCUS_CATEGORY?.trim() || 'Comments',
      categoryId: process.env.GISCUS_CATEGORY_ID?.trim() ?? '',
      /** Giscus iframe UI language (`lang`). Default `en`; header above stays Hebrew in code. */
      lang: process.env.GISCUS_LANG?.trim() || 'en',
    },
  },

  future: {
    v4: true,
  },

  url: 'https://whatsper.github.io',
  baseUrl: '/texterdocs/',

  organizationName: 'whatsper',
  projectName: 'texterdocs',
  deploymentBranch: 'gh-pages',
  trailingSlash: false,


  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  plugins: [
    [
      'posthog-docusaurus',
      {
        apiKey: 'phc_iL9KL167XomfXigTW0EcGYWjkcu1HcucymYiphXBWD7',
        appUrl: 'https://eu.i.posthog.com',
        enableInDevelopment: false,
      },
    ],
    [
      '@docusaurus/plugin-client-redirects',
      {
        redirects: [
          {
            from: ['/templates-import', '/docs/tools/template-json-import'],
            to: '/docs/templates-import-export',
          },
          {
            from: '/docs/YAML/Types/Func/System/Split',
            to: '/docs/YAML/Types/Func/System/Bot State Split',
          },
        ],
      },
    ],
  ],

  markdown: {
    mermaid: true,
  },

  themes: [
    '@docusaurus/theme-mermaid',
    [
      '@easyops-cn/docusaurus-search-local',
      {
        hashed: true,
        indexBlog: true,
        docsRouteBasePath: '/docs',
        blogRouteBasePath: '/changelog',
      },
    ],
  ],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          showLastUpdateTime: true,
          showLastUpdateAuthor: false,
        },
        blog: {
          routeBasePath: 'changelog',
          blogTitle: 'Changelog',
          blogDescription: 'Updates, new features, and changes to Texter',
          blogSidebarTitle: 'Recent Updates',
          blogSidebarCount: 'ALL',
          showReadingTime: false,
          postsPerPage: 'ALL',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/texter-social-card.jpg',
    docs: {
      sidebar: {
        hideable: true,
        autoCollapseCategories: true,
      },
    },
    navbar: {
      title: 'Texter Docs',
      logo: {
        alt: 'Texter Logo',
        src: 'img/texter_logo.png',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Bot Documentation',
        },
        {
          to: '/scenarios',
          label: 'Scenarios',
          position: 'left',
        },
        {
          to: '/changelog',
          label: 'Changelog',
          position: 'left',
        },
        {
          href: 'https://apidocs.texterchat.com',
          label: 'API Docs',
          position: 'right',
        }
        ,
        {
          href: 'https://www.texterchat.com',
          label: 'Texter Home',
          position: 'right',
        },
        {
          type: 'search',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [],
      copyright: `Copyright \u00A9 ${new Date().getFullYear()} Texter. Built with Docusaurus.`,
    },
    mermaid: {
      theme: { light: 'neutral', dark: 'dark' },
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.vsDark,
      additionalLanguages: ['yaml'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
