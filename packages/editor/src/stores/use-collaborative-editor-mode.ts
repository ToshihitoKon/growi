import { useEffect, useState } from 'react';

import { GlobalSocketEventName, type IUserHasId } from '@growi/core/dist/interfaces';
import { useGlobalSocket, GLOBAL_SOCKET_NS } from '@growi/core/dist/swr';
// see: https://github.com/yjs/y-codemirror.next#example
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { yCollab } from 'y-codemirror.next';
import { SocketIOProvider } from 'y-socket.io';
import * as Y from 'yjs';

import { userColor } from '../consts';
import { UseCodeMirrorEditor } from '../services';

type UserLocalState = {
  name: string;
  user?: IUserHasId;
  color: string;
  colorLight: string;
}

export const useCollaborativeEditorMode = (
    user?: IUserHasId,
    pageId?: string,
    initialValue?: string,
    onOpenEditor?: (markdown: string) => void,
    onUserList?: (userList: IUserHasId[]) => void,
    codeMirrorEditor?: UseCodeMirrorEditor,
): void => {
  const [ydoc, setYdoc] = useState<Y.Doc | null>(null);
  const [provider, setProvider] = useState<SocketIOProvider | null>(null);
  const [isInit, setIsInit] = useState(false);
  const [cPageId, setCPageId] = useState(pageId);

  const { data: socket } = useGlobalSocket();

  const cleanupYDocAndProvider = () => {
    if (cPageId === pageId) {
      return;
    }

    ydoc?.destroy();
    setYdoc(null);

    // NOTICE: Destroying the provider leaves awareness in the other user's connection,
    // so only awareness is destroyed here
    provider?.awareness.destroy();

    // TODO: catch ydoc:sync:error GlobalSocketEventName.YDocSyncError
    socket?.off(GlobalSocketEventName.YDocSync);

    setIsInit(false);
    setCPageId(pageId);
  };

  const setupYDoc = () => {
    if (ydoc != null) {
      return;
    }

    // NOTICE: Old provider destroy at the time of ydoc setup,
    // because the awareness destroying is not sync to other clients
    provider?.destroy();
    setProvider(null);

    const _ydoc = new Y.Doc();
    setYdoc(_ydoc);
  };

  const setupProvider = () => {
    if (provider != null || ydoc == null || socket == null) {
      return;
    }

    const socketIOProvider = new SocketIOProvider(
      GLOBAL_SOCKET_NS,
      `yjs/${pageId}`,
      ydoc,
      { autoConnect: true },
    );

    const userLocalState: UserLocalState = {
      name: user?.name ? `${user.name}` : `Guest User ${Math.floor(Math.random() * 100)}`,
      user,
      color: userColor.color,
      colorLight: userColor.light,
    };

    socketIOProvider.awareness.setLocalStateField('user', userLocalState);

    socketIOProvider.on('sync', (isSync: boolean) => {
      if (isSync) {
        socket.emit(GlobalSocketEventName.YDocSync, { pageId, initialValue });
      }
    });

    // update args type see: SocketIOProvider.Awareness.awarenessUpdate
    socketIOProvider.awareness.on('update', (update: any) => {
      if (onUserList) {
        const { added, removed } = update;
        if (added.length > 0 || removed.length > 0) {
          const userList: IUserHasId[] = Array.from(socketIOProvider.awareness.states.values(), value => value.user.user && value.user.user);
          onUserList(userList);
        }
      }
    });

    setProvider(socketIOProvider);
  };

  const setupYDocExtensions = () => {
    if (ydoc == null || provider == null) {
      return;
    }

    const ytext = ydoc.getText('codemirror');
    const undoManager = new Y.UndoManager(ytext);

    const cleanup = codeMirrorEditor?.appendExtensions?.([
      yCollab(ytext, provider.awareness, { undoManager }),
    ]);

    return cleanup;
  };

  const initializeEditor = () => {
    if (ydoc == null || onOpenEditor == null || isInit === true) {
      return;
    }

    const ytext = ydoc.getText('codemirror');
    codeMirrorEditor?.initDoc(ytext.toString());
    onOpenEditor(ytext.toString());

    setIsInit(true);
  };

  useEffect(cleanupYDocAndProvider, [cPageId, pageId, provider, socket, ydoc]);
  useEffect(setupYDoc, [provider, ydoc]);
  useEffect(setupProvider, [initialValue, onUserList, pageId, provider, socket, user, ydoc]);
  useEffect(setupYDocExtensions, [codeMirrorEditor, provider, ydoc]);
  useEffect(initializeEditor, [codeMirrorEditor, isInit, onOpenEditor, ydoc]);
};
