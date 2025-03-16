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
      type: 'category',
      label: 'Core',
      items: ['core/injectable-service'],
    },
    {
      type: 'category',
      label: 'History Decorators',
      link: {type: 'doc', id: 'api/history-decorators'},
      items: [
        {
          type: 'link',
          label: '@onHistoryVisited()',
          href: '/docs/api/history-decorators#onhistoryvisited',
        },
        {
          type: 'link',
          label: '@onHistoryVisitRemoved()',
          href: '/docs/api/history-decorators#onhistoryvisitremoved',
        },
        {
          type: 'link',
          label: '@historyItem()',
          href: '/docs/api/history-decorators#historyitem',
        },
        {
          type: 'link',
          label: '@removedInfo()',
          href: '/docs/api/history-decorators#removedinfo',
        },
      ],
    },
    {
      type: 'category',
      label: 'Windows Decorators',
      link: {type: 'doc', id: 'api/windows-decorators'},
      items: [
        {
          type: 'link',
          label: '@onWindowCreated()',
          href: '/docs/api/windows-decorators#onwindowcreated',
        },
        {
          type: 'link',
          label: '@onWindowRemoved()',
          href: '/docs/api/windows-decorators#onwindowremoved',
        },
        {
          type: 'link',
          label: '@onWindowFocusChanged()',
          href: '/docs/api/windows-decorators#onwindowfocuschanged',
        },
        {
          type: 'link',
          label: '@windowInfo()',
          href: '/docs/api/windows-decorators#windowinfo',
        },
      ],
    },
    {
      type: 'category',
      label: 'Sessions Decorators',
      link: {type: 'doc', id: 'api/sessions-decorators'},
      items: [
        {
          type: 'link',
          label: '@onSessionChanged()',
          href: '/docs/api/sessions-decorators#onsessionchanged',
        },
      ],
    },
    {
      type: 'category',
      label: 'Runtime Decorators',
      link: {type: 'doc', id: 'api/runtime-decorators'},
      items: [
        {
          type: 'link',
          label: '@onInstalled()',
          href: '/docs/api/runtime-decorators#oninstalled',
        },
        {
          type: 'link',
          label: '@onBrowserStartup()',
          href: '/docs/api/runtime-decorators#onbrowserstartup',
        },
        {
          type: 'link',
          label: '@onExtensionSuspend()',
          href: '/docs/api/runtime-decorators#onextensionsuspend',
        },
        {
          type: 'link',
          label: '@onSuspendCanceled()',
          href: '/docs/api/runtime-decorators#onsuspendcanceled',
        },
        {
          type: 'link',
          label: '@onUpdateAvailable()',
          href: '/docs/api/runtime-decorators#onupdateavailable',
        },
        {
          type: 'link',
          label: '@installedDetails()',
          href: '/docs/api/runtime-decorators#installeddetails',
        },
        {
          type: 'link',
          label: '@updateDetails()',
          href: '/docs/api/runtime-decorators#updatedetails',
        },
      ],
    },
    {
      type: 'category',
      label: 'Permissions Decorators',
      link: {type: 'doc', id: 'api/permissions-decorators'},
      items: [
        {
          type: 'link',
          label: '@onPermissionsAdded()',
          href: '/docs/api/permissions-decorators#onpermissionsadded',
        },
        {
          type: 'link',
          label: '@onPermissionsRemoved()',
          href: '/docs/api/permissions-decorators#onpermissionsremoved',
        },
        {
          type: 'link',
          label: '@permissionDetails()',
          href: '/docs/api/permissions-decorators#permissiondetails',
        },
      ],
    },
    {
      type: 'category',
      label: 'Management Decorators',
      link: {type: 'doc', id: 'api/management-decorators'},
      items: [
        {
          type: 'link',
          label: '@onExtensionInstalled()',
          href: '/docs/api/management-decorators#onextensioninstalled',
        },
        {
          type: 'link',
          label: '@onExtensionUninstalled()',
          href: '/docs/api/management-decorators#onextensionuninstalled',
        },
        {
          type: 'link',
          label: '@onExtensionEnabled()',
          href: '/docs/api/management-decorators#onextensionenabled',
        },
        {
          type: 'link',
          label: '@onExtensionDisabled()',
          href: '/docs/api/management-decorators#onextensiondisabled',
        },
        {
          type: 'link',
          label: '@extensionInfo()',
          href: '/docs/api/management-decorators#extensioninfo',
        },
        {
          type: 'link',
          label: '@extensionId()',
          href: '/docs/api/management-decorators#extensionid',
        },
      ],
    },
    {
      type: 'category',
      label: 'Idle Decorators',
      link: {type: 'doc', id: 'api/idle-decorators'},
      items: [
        {
          type: 'link',
          label: '@onIdleStateChanged()',
          href: '/docs/api/idle-decorators#onidlestatechanged',
        },
      ],
    },
    {
      type: 'category',
      label: 'Alarms Decorators',
      link: {type: 'doc', id: 'api/alarms-decorators'},
      items: [
        {
          type: 'link',
          label: '@onAlarmFired()',
          href: '/docs/api/alarms-decorators#onalarmfired',
        },
        {
          type: 'link',
          label: '@alarmDetails()',
          href: '/docs/api/alarms-decorators#alarmdetails',
        },
      ],
    },
    {
      type: 'category',
      label: 'Bookmarks Decorators',
      link: {type: 'doc', id: 'api/bookmarks-decorators'},
      items: [
        {
          type: 'link',
          label: '@onBookmarkCreated()',
          href: '/docs/api/bookmarks-decorators#onbookmarkcreated',
        },
        {
          type: 'link',
          label: '@onBookmarkChanged()',
          href: '/docs/api/bookmarks-decorators#onbookmarkchanged',
        },
        {
          type: 'link',
          label: '@onBookmarkMoved()',
          href: '/docs/api/bookmarks-decorators#onbookmarkmoved',
        },
        {
          type: 'link',
          label: '@onBookmarkRemoved()',
          href: '/docs/api/bookmarks-decorators#onbookmarkremoved',
        },
        {
          type: 'link',
          label: '@bookmarkId()',
          href: '/docs/api/bookmarks-decorators#bookmarkid',
        },
        {
          type: 'link',
          label: '@bookmarkNode()',
          href: '/docs/api/bookmarks-decorators#bookmarknode',
        },
        {
          type: 'link',
          label: '@bookmarkChangedId()',
          href: '/docs/api/bookmarks-decorators#bookmarkchangedid',
        },
        {
          type: 'link',
          label: '@bookmarkChangeInfo()',
          href: '/docs/api/bookmarks-decorators#bookmarkchangeinfo',
        },
        {
          type: 'link',
          label: '@bookmarkMovedId()',
          href: '/docs/api/bookmarks-decorators#bookmarkmovedid',
        },
        {
          type: 'link',
          label: '@bookmarkMoveInfo()',
          href: '/docs/api/bookmarks-decorators#bookmarkmoveinfo',
        },
        {
          type: 'link',
          label: '@bookmarkRemovedId()',
          href: '/docs/api/bookmarks-decorators#bookmarkremovedid',
        },
        {
          type: 'link',
          label: '@bookmarkRemoveInfo()',
          href: '/docs/api/bookmarks-decorators#bookmarkremoveinfo',
        },
      ],
    },
    {
      type: 'category',
      label: 'Commands Decorators',
      link: {type: 'doc', id: 'api/commands-decorators'},
      items: [
        {
          type: 'link',
          label: '@onCommand()',
          href: '/docs/api/commands-decorators#oncommand',
        },
      ],
    },
    {
      type: 'category',
      label: 'Downloads Decorators',
      link: {type: 'doc', id: 'api/downloads-decorators'},
      items: [
        {
          type: 'link',
          label: '@onDownloadCreated()',
          href: '/docs/api/downloads-decorators#ondownloadcreated',
        },
        {
          type: 'link',
          label: '@onDownloadChanged()',
          href: '/docs/api/downloads-decorators#ondownloadchanged',
        },
        {
          type: 'link',
          label: '@onDownloadErased()',
          href: '/docs/api/downloads-decorators#ondownloaderased',
        },
        {
          type: 'link',
          label: '@downloadItem()',
          href: '/docs/api/downloads-decorators#downloaditem',
        },
        {
          type: 'link',
          label: '@downloadDelta()',
          href: '/docs/api/downloads-decorators#downloaddelta',
        },
      ],
    },
    {
      type: 'category',
      label: 'Messaging Decorators',
      link: {type: 'doc', id: 'api/messaging-decorators'},
      items: [
        {
          type: 'link',
          label: '@onMessage()',
          href: '/docs/api/messaging-decorators#onmessage',
        },
        {
          type: 'link',
          label: '@messageData()',
          href: '/docs/api/messaging-decorators#messagedata',
        },
        {
          type: 'link',
          label: '@messageSender()',
          href: '/docs/api/messaging-decorators#messagesender',
        },
      ],
    },
  ],
};

export default sidebars;
