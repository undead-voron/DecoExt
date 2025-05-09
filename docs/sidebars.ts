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
      label: 'alarms',
      link: {type: 'doc', id: 'api/alarms-decorators'},
      items: [
        {
          type: 'link',
          label: '@onAlarmFired()',
          href: '/api/alarms-decorators#onalarmfired',
        },
        {
          type: 'link',
          label: '@alarmDetails()',
          href: '/api/alarms-decorators#alarmdetails',
        },
      ],
    },
    {
      type: 'category',
      label: 'bookmarks',
      link: {type: 'doc', id: 'api/bookmarks-decorators'},
      items: [
        {
          type: 'link',
          label: '@onBookmarkCreated()',
          href: '/api/bookmarks-decorators#onbookmarkcreated',
        },
        {
          type: 'link',
          label: '@onBookmarkChanged()',
          href: '/api/bookmarks-decorators#onbookmarkchanged',
        },
        {
          type: 'link',
          label: '@onBookmarkMoved()',
          href: '/api/bookmarks-decorators#onbookmarkmoved',
        },
        {
          type: 'link',
          label: '@onBookmarkRemoved()',
          href: '/api/bookmarks-decorators#onbookmarkremoved',
        },
        {
          type: 'link',
          label: '@bookmarkId()',
          href: '/api/bookmarks-decorators#bookmarkid',
        },
        {
          type: 'link',
          label: '@bookmarkNode()',
          href: '/api/bookmarks-decorators#bookmarknode',
        },
        {
          type: 'link',
          label: '@bookmarkChangedId()',
          href: '/api/bookmarks-decorators#bookmarkchangedid',
        },
        {
          type: 'link',
          label: '@bookmarkChangeInfo()',
          href: '/api/bookmarks-decorators#bookmarkchangeinfo',
        },
        {
          type: 'link',
          label: '@bookmarkMovedId()',
          href: '/api/bookmarks-decorators#bookmarkmovedid',
        },
        {
          type: 'link',
          label: '@bookmarkMoveInfo()',
          href: '/api/bookmarks-decorators#bookmarkmoveinfo',
        },
        {
          type: 'link',
          label: '@bookmarkRemovedId()',
          href: '/api/bookmarks-decorators#bookmarkremovedid',
        },
        {
          type: 'link',
          label: '@bookmarkRemoveInfo()',
          href: '/api/bookmarks-decorators#bookmarkremoveinfo',
        },
      ],
    },
    {
      type: 'category',
      label: 'commands',
      link: {type: 'doc', id: 'api/commands-decorators'},
      items: [
        {
          type: 'link',
          label: '@onCommand()',
          href: '/api/commands-decorators#oncommand',
        },
      ],
    },
    {
      type: 'category',
      label: 'downloads',
      link: {type: 'doc', id: 'api/downloads-decorators'},
      items: [
        {
          type: 'link',
          label: '@onDownloadCreated()',
          href: '/api/downloads-decorators#ondownloadcreated',
        },
        {
          type: 'link',
          label: '@onDownloadChanged()',
          href: '/api/downloads-decorators#ondownloadchanged',
        },
        {
          type: 'link',
          label: '@onDownloadErased()',
          href: '/api/downloads-decorators#ondownloaderased',
        },
        {
          type: 'link',
          label: '@downloadItem()',
          href: '/api/downloads-decorators#downloaditem',
        },
        {
          type: 'link',
          label: '@downloadDelta()',
          href: '/api/downloads-decorators#downloaddelta',
        },
      ],
    },
    {
      type: 'category',
      label: 'history',
      link: {type: 'doc', id: 'api/history-decorators'},
      items: [
        {
          type: 'link',
          label: '@onHistoryVisited()',
          href: '/api/history-decorators#onhistoryvisited',
        },
        {
          type: 'link',
          label: '@onHistoryVisitRemoved()',
          href: '/api/history-decorators#onhistoryvisitremoved',
        },
        {
          type: 'link',
          label: '@historyItem()',
          href: '/api/history-decorators#historyitem',
        },
        {
          type: 'link',
          label: '@removedInfo()',
          href: '/api/history-decorators#removedinfo',
        },
      ],
    },
    {
      type: 'category',
      label: 'idle',
      link: {type: 'doc', id: 'api/idle-decorators'},
      items: [
        {
          type: 'link',
          label: '@onIdleStateChanged()',
          href: '/api/idle-decorators#onidlestatechanged',
        },
      ],
    },
    {
      type: 'category',
      label: 'management',
      link: {type: 'doc', id: 'api/management-decorators'},
      items: [
        {
          type: 'link',
          label: '@onExtensionInstalled()',
          href: '/api/management-decorators#onextensioninstalled',
        },
        {
          type: 'link',
          label: '@onExtensionUninstalled()',
          href: '/api/management-decorators#onextensionuninstalled',
        },
        {
          type: 'link',
          label: '@onExtensionEnabled()',
          href: '/api/management-decorators#onextensionenabled',
        },
        {
          type: 'link',
          label: '@onExtensionDisabled()',
          href: '/api/management-decorators#onextensiondisabled',
        },
        {
          type: 'link',
          label: '@extensionInfo()',
          href: '/api/management-decorators#extensioninfo',
        },
        {
          type: 'link',
          label: '@extensionId()',
          href: '/api/management-decorators#extensionid',
        },
      ],
    },
    {
      type: 'category',
      label: 'messaging',
      link: {type: 'doc', id: 'api/messaging-decorators'},
      items: [
        {
          type: 'link',
          label: '@onMessage()',
          href: '/api/messaging-decorators#onmessage',
        },
        {
          type: 'link',
          label: '@messageData()',
          href: '/api/messaging-decorators#messagedata',
        },
        {
          type: 'link',
          label: '@messageSender()',
          href: '/api/messaging-decorators#messagesender',
        },
      ],
    },
    {
      type: 'category',
      label: 'omnibox',
      link: {type: 'doc', id: 'api/omnibox-decorators'},
      items: [
        {
          type: 'link',
          label: '@onOmniboxInputStarted()',
          href: '/api/omnibox-decorators#onomniboxinputstarted',
        },
        {
          type: 'link',
          label: '@onOmniboxInputChanged()',
          href: '/api/omnibox-decorators#onomniboxinputchanged',
        },
        {
          type: 'link',
          label: '@onOmniboxInputEntered()',
          href: '/api/omnibox-decorators#onomniboxinputentered',
        },
        {
          type: 'link',
          label: '@onOmniboxInputCancelled()',
          href: '/api/omnibox-decorators#onomniboxinputcancelled',
        },
        {
          type: 'link',
          label: '@onOmniboxDeleteSuggestion()',
          href: '/api/omnibox-decorators#onomniboxdeletesuggestion',
        },
        {
          type: 'link',
          label: '@omniboxInputChangedDetails()',
          href: '/api/omnibox-decorators#omniboxinputchangeddetails',
        },
        {
          type: 'link',
          label: '@omniboxInputEntered()',
          href: '/api/omnibox-decorators#omniboxinputentered',
        },
      ],
    },
    {
      type: 'category',
      label: 'permissions',
      link: {type: 'doc', id: 'api/permissions-decorators'},
      items: [
        {
          type: 'link',
          label: '@onPermissionsAdded()',
          href: '/api/permissions-decorators#onpermissionsadded',
        },
        {
          type: 'link',
          label: '@onPermissionsRemoved()',
          href: '/api/permissions-decorators#onpermissionsremoved',
        },
        {
          type: 'link',
          label: '@permissionDetails()',
          href: '/api/permissions-decorators#permissiondetails',
        },
      ],
    },
    {
      type: 'category',
      label: 'runtime',
      link: {type: 'doc', id: 'api/runtime-decorators'},
      items: [
        {
          type: 'link',
          label: '@onInstalled()',
          href: '/api/runtime-decorators#oninstalled',
        },
        {
          type: 'link',
          label: '@onBrowserStartup()',
          href: '/api/runtime-decorators#onbrowserstartup',
        },
        {
          type: 'link',
          label: '@onExtensionSuspend()',
          href: '/api/runtime-decorators#onextensionsuspend',
        },
        {
          type: 'link',
          label: '@onSuspendCanceled()',
          href: '/api/runtime-decorators#onsuspendcanceled',
        },
        {
          type: 'link',
          label: '@onUpdateAvailable()',
          href: '/api/runtime-decorators#onupdateavailable',
        },
        {
          type: 'link',
          label: '@installedDetails()',
          href: '/api/runtime-decorators#installeddetails',
        },
        {
          type: 'link',
          label: '@updateDetails()',
          href: '/api/runtime-decorators#updatedetails',
        },
      ],
    },
    {
      type: 'category',
      label: 'sessions',
      link: {type: 'doc', id: 'api/sessions-decorators'},
      items: [
        {
          type: 'link',
          label: '@onSessionChanged()',
          href: '/api/sessions-decorators#onsessionchanged',
        },
      ],
    },
    {
      type: 'category',
      label: 'tabs',
      link: {type: 'doc', id: 'api/tabs-decorators'},
      items: [
        {
          type: 'link',
          label: '@onTabActivated()',
          href: '/api/tabs-decorators#ontabactivated',
        },
        {
          type: 'link',
          label: '@onTabCreated()',
          href: '/api/tabs-decorators#ontabcreated',
        },
        {
          type: 'link',
          label: '@onTabRemoved()',
          href: '/api/tabs-decorators#ontabremoved',
        },
        {
          type: 'link',
          label: '@onTabUpdated()',
          href: '/api/tabs-decorators#ontabupdated',
        },
        {
          type: 'link',
          label: '@onTabZoomChange()',
          href: '/api/tabs-decorators#ontabzoomchange',
        },
        {
          type: 'link',
          label: '@activatedTabDetails()',
          href: '/api/tabs-decorators#activatedtabdetails',
        },
        {
          type: 'link',
          label: '@createdTabDetails()',
          href: '/api/tabs-decorators#createdtabdetails',
        },
        {
          type: 'link',
          label: '@removedTabDetails()',
          href: '/api/tabs-decorators#removedtabdetails',
        },
        {
          type: 'link',
          label: '@tabUpdatedDetails()',
          href: '/api/tabs-decorators#tabupdateddetails',
        },
        {
          type: 'link',
          label: '@tabUpdatedTab()',
          href: '/api/tabs-decorators#tabupdatedtab',
        },
        {
          type: 'link',
          label: '@zoomChangeInfo()',
          href: '/api/tabs-decorators#zoomchangeinfo',
        },
      ],
    },
    {
      type: 'category',
      label: 'webNavigation',
      link: {type: 'doc', id: 'api/web-navigation-decorators'},
      items: [
        {
          type: 'link',
          label: '@onBeforeNavigate()',
          href: '/api/web-navigation-decorators#onbeforenavigate',
        },
        {
          type: 'link',
          label: '@onNavigationCommitted()',
          href: '/api/web-navigation-decorators#onnavigationcommitted',
        },
        {
          type: 'link',
          label: '@onNavigationCompleted()',
          href: '/api/web-navigation-decorators#onnavigationcompleted',
        },
        {
          type: 'link',
          label: '@onDOMContentLoaded()',
          href: '/api/web-navigation-decorators#ondomcontentloaded',
        },
        {
          type: 'link',
          label: '@onNavigationError()',
          href: '/api/web-navigation-decorators#onnavigationerror',
        },
        {
          type: 'link',
          label: '@onHistoryStateUpdated()',
          href: '/api/web-navigation-decorators#onhistorystateupdated',
        },
        {
          type: 'link',
          label: '@onReferenceFragmentUpdated()',
          href: '/api/web-navigation-decorators#onreferencefragmentupdated',
        },
        {
          type: 'link',
          label: '@onTabReplaced()',
          href: '/api/web-navigation-decorators#ontabreplaced',
        },
        {
          type: 'link',
          label: '@navigationDetails()',
          href: '/api/web-navigation-decorators#navigationdetails',
        },
        {
          type: 'link',
          label: '@navigationCommittedDetails()',
          href: '/api/web-navigation-decorators#navigationcommitteddetails',
        },
        {
          type: 'link',
          label: '@navigationCompletedDetails()',
          href: '/api/web-navigation-decorators#navigationcompleteddetails',
        },
        {
          type: 'link',
          label: '@domContentLoadedDetails()',
          href: '/api/web-navigation-decorators#domcontentloadeddetails',
        },
        {
          type: 'link',
          label: '@navigationErrorDetails()',
          href: '/api/web-navigation-decorators#navigationerrordetails',
        },
        {
          type: 'link',
          label: '@historyStateUpdatedDetails()',
          href: '/api/web-navigation-decorators#historystateupdateddetails',
        },
        {
          type: 'link',
          label: '@referenceFragmentUpdatedDetails()',
          href: '/api/web-navigation-decorators#referencefragmentupdateddetails',
        },
        {
          type: 'link',
          label: '@tabReplacedDetails()',
          href: '/api/web-navigation-decorators#tabreplaceddetails',
        },
      ],
    },
    {
      type: 'category',
      label: 'windows',
      link: {type: 'doc', id: 'api/windows-decorators'},
      items: [
        {
          type: 'link',
          label: '@onWindowCreated()',
          href: '/api/windows-decorators#onwindowcreated',
        },
        {
          type: 'link',
          label: '@onWindowRemoved()',
          href: '/api/windows-decorators#onwindowremoved',
        },
        {
          type: 'link',
          label: '@onWindowFocusChanged()',
          href: '/api/windows-decorators#onwindowfocuschanged',
        },
        {
          type: 'link',
          label: '@windowInfo()',
          href: '/api/windows-decorators#windowinfo',
        },
      ],
    },
  ],
};

export default sidebars;
