/// <reference types="vite/client" />

/**
 * Minimal ambient declarations for the browser APIs SmritiTab uses.
 *
 * The project intentionally avoids `@types/chrome`; these narrow declarations
 * describe exactly the surface that `src/lib/chrome.ts` consumes, which keeps
 * the extension code type-safe without pulling a large dependency in.
 */

declare namespace chrome {
  namespace runtime {
    const id: string | undefined;
    const lastError: { message?: string } | undefined;

    function getURL(path: string): string;
    function getManifest(): { name: string; version: string; [key: string]: unknown };

    function sendMessage(message: unknown): Promise<unknown>;
    function openOptionsPage(): Promise<void>;

    const onMessage: {
      addListener(
        callback: (
          message: unknown,
          sender: unknown,
          sendResponse: (response?: unknown) => void,
        ) => boolean | void,
      ): void;
      removeListener(
        callback: (
          message: unknown,
          sender: unknown,
          sendResponse: (response?: unknown) => void,
        ) => boolean | void,
      ): void;
    };

    const onInstalled: {
      addListener(callback: (details: { reason: string }) => void): void;
    };
  }

  namespace storage {
    namespace local {
      function get(keys?: string | string[] | null): Promise<Record<string, unknown>>;
      function set(items: Record<string, unknown>): Promise<void>;
      function remove(keys: string | string[]): Promise<void>;
    }
  }

  namespace bookmarks {
    interface BookmarkTreeNode {
      id: string;
      title: string;
      url?: string;
      children?: BookmarkTreeNode[];
      parentId?: string;
      index?: number;
      dateAdded?: number;
    }

    function getTree(): Promise<BookmarkTreeNode[]>;
    function create(bookmark: {
      parentId?: string;
      title: string;
      url?: string;
      index?: number;
    }): Promise<BookmarkTreeNode>;
    function update(
      id: string,
      changes: { title?: string; url?: string; parentId?: string },
    ): Promise<BookmarkTreeNode>;
    function move(id: string, parentId: string, index?: number): Promise<BookmarkTreeNode>;
    function remove(id: string): Promise<void>;
    function removeTree(id: string): Promise<void>;

    interface MoveInfo {
      parentId: string;
      index: number;
      oldParentId: string;
      oldIndex: number;
    }

    interface RemoveInfo {
      parentId: string;
      index: number;
      node: BookmarkTreeNode;
    }

    const onCreated: {
      addListener(callback: (id: string, node: BookmarkTreeNode) => void): void;
      removeListener(callback: (id: string, node: BookmarkTreeNode) => void): void;
    };
    const onRemoved: {
      addListener(callback: (id: string, removeInfo: RemoveInfo) => void): void;
      removeListener(callback: (id: string, removeInfo: RemoveInfo) => void): void;
    };
    const onChanged: {
      addListener(
        callback: (id: string, changeInfo: { title: string; url?: string }) => void,
      ): void;
      removeListener(
        callback: (id: string, changeInfo: { title: string; url?: string }) => void,
      ): void;
    };
    const onMoved: {
      addListener(callback: (id: string, moveInfo: MoveInfo) => void): void;
      removeListener(callback: (id: string, moveInfo: MoveInfo) => void): void;
    };
    const onChildrenReordered: {
      addListener(
        callback: (id: string, reorderInfo: { childIds: string[] }) => void,
      ): void;
      removeListener(
        callback: (id: string, reorderInfo: { childIds: string[] }) => void,
      ): void;
    };
    const onImportEnded: {
      addListener(callback: () => void): void;
      removeListener(callback: () => void): void;
    };
  }

  namespace history {
    interface HistoryItem {
      id?: string;
      title?: string;
      url?: string;
      lastVisitTime?: number;
      visitCount?: number;
    }

    function search(query: {
      text: string;
      startTime?: number;
      maxResults?: number;
    }): Promise<HistoryItem[]>;

    function deleteUrl(url: string): Promise<void>;
  }

  namespace tabs {
    interface Tab {
      id?: number;
      url?: string;
      active?: boolean;
      title?: string;
      lastAccessed?: number;
    }

    function create(properties: { url: string; active?: boolean }): Promise<Tab>;
    function query(queryInfo: {
      url?: string;
      active?: boolean;
      currentWindow?: boolean;
    }): Promise<Tab[]>;
  }

  namespace commands {
    const onCommand: {
      addListener(callback: (command: string, tab?: unknown) => void): void;
    };
  }

  namespace contextMenus {
    interface CreateProperties {
      id?: string;
      title: string;
      contexts: string[];
    }

    interface OnClickData {
      menuItemId: string | number;
      selectionText?: string;
      pageUrl?: string;
    }

    function create(properties: CreateProperties): void;
    function remove(id: string): void;

    const onClicked: {
      addListener(callback: (data: OnClickData, tab?: unknown) => void): void;
    };
  }
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResult {
  readonly length: number;
  readonly isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

interface Window {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}
