import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Texter Docs',
  tagline: 'Build powerful WhatsApp chatbots with YAML',
  favicon: 'img/favicon.svg',

  customFields: {
    feedbackWebhookUrl: process.env.FEEDBACK_WEBHOOK_URL ?? '',
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
    image: 'img/texter-social-card.png',
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
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'Getting Started',
              to: '/docs/intro',
            },
            {
              label: 'YAML Overview',
              to: '/docs/YAML/Overview',
            },
            {
              label: 'Bot Configuration',
              to: '/docs/YAML/Bot Configuration',
            },
            {
              label: 'Scenario Marketplace',
              to: '/scenarios',
            },
          ],
        },
        {
          title: 'Texter',
          items: [
            {
              label: 'Texter Home',
              href: 'https://www.texterchat.com',
            },
            {
              label: 'API Documentation',
              href: 'https://apidocs.texterchat.com',
            },
          ],
        },
      ],
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
