import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  // Custom sidebar structure with API docs at root level
  tutorialSidebar: [
    'intro',
    {
      type: 'doc',
      id: 'core/injectable-service',
      label: '@InjectableService()',
    },
    {
      type: 'category',
      label: 'API Reference',
      link: {
        type: 'generated-index',
        title: 'API Reference',
        description: 'Details on all available decorators and utilities.',
        slug: '/category/api-reference'
      },
      items: [
        'api/alarms-decorators',
        'api/bookmarks-decorators',
        'api/commands-decorators',
        'api/downloads-decorators',
        'api/history-decorators',
        'api/idle-decorators',
        'api/management-decorators',
        'api/messaging-decorators',
        'api/omnibox-decorators',
        'api/permissions-decorators',
        'api/runtime-decorators',
        'api/sessions-decorators',
        'api/storage-decorators',
        'api/tabs-decorators',
        'api/web-navigation-decorators',
        'api/windows-decorators',
      ]
    },
    // Removed all individual decorator categories as they will be under "API Reference"
  ],
};

export default sidebars;
