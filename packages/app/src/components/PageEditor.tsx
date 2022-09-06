import React, {
  useCallback, useEffect, useMemo, useRef, useState,
} from 'react';

import EventEmitter from 'events';

import { envUtils, PageGrant } from '@growi/core';
import detectIndent from 'detect-indent';
import { throttle, debounce } from 'throttle-debounce';

import { saveAndReload } from '~/client/services/page-operation';
import { apiGet, apiPostForm } from '~/client/util/apiv1-client';
import { getOptionsToSave } from '~/client/util/editor';
import {
  useIsEditable, useIsIndentSizeForced, useCurrentPagePath, useCurrentPathname, useCurrentPageId, useIsUploadableFile, useIsUploadableImage,
} from '~/stores/context';
import {
  useCurrentIndentSize, useSWRxSlackChannels, useIsSlackEnabled, useIsTextlintEnabled, usePageTagsForEditors,
  useIsEnabledUnsavedWarning,
} from '~/stores/editor';
import { useSWRxCurrentPage } from '~/stores/page';
import { usePreviewOptions } from '~/stores/renderer';
import {
  EditorMode,
  useEditorMode, useIsMobile, useSelectedGrant,
} from '~/stores/ui';
import loggerFactory from '~/utils/logger';


// import { ConflictDiffModal } from './PageEditor/ConflictDiffModal';
import Editor from './PageEditor/Editor';
import Preview from './PageEditor/Preview';
import scrollSyncHelper from './PageEditor/ScrollSyncHelper';


const logger = loggerFactory('growi:PageEditor');


declare const globalEmitter: EventEmitter;


type EditorRef = {
  setValue: (markdown: string) => void,
  setCaretLine: (line: number) => void,
  insertText: (text: string) => void,
  forceToFocus: () => void,
  terminateUploadingState: () => void,
}

type Props = {
  // pageContainer: PageContainer,

  // isEditable: boolean,

  // editorMode: string,
  // isSlackEnabled: boolean,
  // slackChannels: string,
  // isMobile?: boolean,

  // grant: number,
  // grantGroupId?: string,
  // grantGroupName?: string,
  // mutateGrant: (grant: number) => void,

  // isTextlintEnabled?: boolean,
  // isIndentSizeForced?: boolean,
  // indentSize?: number,
  // mutateCurrentIndentSize: (indent: number) => void,
};

// for scrolling
let lastScrolledDateWithCursor: Date | null = null;
let isOriginOfScrollSyncEditor = false;
let isOriginOfScrollSyncPreview = false;

const PageEditor = React.memo((props: Props): JSX.Element => {
  // const {
  //   pageContainer,
  // } = props;

  const { data: pageId } = useCurrentPageId();
  const { data: currentPagePath } = useCurrentPagePath();
  const { data: currentPathname } = useCurrentPathname();
  const { data: currentPage } = useSWRxCurrentPage();
  const { data: grantData, mutate: mutateGrant } = useSelectedGrant();
  const { data: pageTags } = usePageTagsForEditors(pageId);

  const { data: isEditable } = useIsEditable();
  const { data: editorMode } = useEditorMode();
  const { data: isMobile } = useIsMobile();
  const { data: isSlackEnabled } = useIsSlackEnabled();
  const { data: slackChannelsData } = useSWRxSlackChannels(currentPagePath);
  const { data: isTextlintEnabled } = useIsTextlintEnabled();
  const { data: isIndentSizeForced } = useIsIndentSizeForced();
  const { data: indentSize, mutate: mutateCurrentIndentSize } = useCurrentIndentSize();
  const { data: isEnabledUnsavedWarning, mutate: mutateIsEnabledUnsavedWarning } = useIsEnabledUnsavedWarning();
  const { data: isUploadableFile } = useIsUploadableFile();
  const { data: isUploadableImage } = useIsUploadableImage();

  const { data: rendererOptions } = usePreviewOptions();

  const initialValue = currentPage?.revision?.body;

  const [markdown, setMarkdown] = useState<string>(initialValue ?? '');

  const slackChannels = useMemo(() => (slackChannelsData ? slackChannelsData.toString() : ''), []);


  const editorRef = useRef<EditorRef>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const setMarkdownWithDebounce = useMemo(() => debounce(50, throttle(100, value => setMarkdown(value))), []);


  const markdownChangedHandler = useCallback((value: string): void => {
    setMarkdownWithDebounce(value);
  }, [setMarkdownWithDebounce]);


  const saveWithShortcut = useCallback(async() => {
    if (grantData == null) {
      return;
    }

    const optionsToSave = getOptionsToSave(
      isSlackEnabled ?? false, slackChannels,
      grantData.grant, grantData.grantedGroup?.id, grantData.grantedGroup?.name,
      pageTags || [],
    );

    try {
      // disable unsaved warning
      mutateIsEnabledUnsavedWarning(false);

      // eslint-disable-next-line no-unused-vars
      // const { tags } = await pageContainer.save(markdown, editorMode, optionsToSave);
      logger.debug('success to save');

      // pageContainer.showSuccessToastr();
    }
    catch (error) {
      logger.error('failed to save', error);
      // pageContainer.showErrorToastr(error);
    }
  }, [grantData, isSlackEnabled, slackChannels, pageTags, mutateIsEnabledUnsavedWarning]);


  /**
   * the upload event handler
   * @param {any} file
   */
  const uploadHandler = useCallback(async(file) => {
    if (editorRef.current == null) {
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let res: any = await apiGet('/attachments.limit', {
        fileSize: file.size,
      });

      if (!res.isUploadable) {
        throw new Error(res.errorMessage);
      }

      const formData = new FormData();
      // const { pageId, path } = pageContainer.state;
      formData.append('file', file);
      if (currentPagePath != null) {
        formData.append('path', currentPagePath);
      }
      if (pageId != null) {
        formData.append('page_id', pageId);
      }

      res = await apiPostForm('/attachments.add', formData);
      const attachment = res.attachment;
      const fileName = attachment.originalName;

      let insertText = `[${fileName}](${attachment.filePathProxied})`;
      // when image
      if (attachment.fileFormat.startsWith('image/')) {
        // modify to "![fileName](url)" syntax
        insertText = `!${insertText}`;
      }
      editorRef.current.insertText(insertText);

      // when if created newly
      if (res.pageCreated) {
        logger.info('Page is created', res.page._id);
        // pageContainer.updateStateAfterSave(res.page, res.tags, res.revision, editorMode);
        mutateGrant(res.page.grant);
      }
    }
    catch (e) {
      logger.error('failed to upload', e);
      // pageContainer.showErrorToastr(e);
    }
    finally {
      editorRef.current.terminateUploadingState();
    }
  // }, [editorMode, mutateGrant, pageContainer]);
  }, [currentPagePath, mutateGrant, pageId]);


  const scrollPreviewByEditorLine = useCallback((line: number) => {
    if (previewRef.current == null) {
      return;
    }

    // prevent circular invocation
    if (isOriginOfScrollSyncPreview) {
      isOriginOfScrollSyncPreview = false; // turn off the flag
      return;
    }

    // turn on the flag
    isOriginOfScrollSyncEditor = true;
    scrollSyncHelper.scrollPreview(previewRef.current, line);
  }, []);
  const scrollPreviewByEditorLineWithThrottle = useMemo(() => throttle(20, scrollPreviewByEditorLine), [scrollPreviewByEditorLine]);

  /**
   * the scroll event handler from codemirror
   * @param {any} data {left, top, width, height, clientWidth, clientHeight} object that represents the current scroll position,
   *                    the size of the scrollable area, and the size of the visible area (minus scrollbars).
   *                    And data.line is also available that is added by Editor component
   * @see https://codemirror.net/doc/manual.html#events
   */
  const editorScrolledHandler = useCallback(({ line }: { line: number }) => {
    // prevent scrolling
    //   if the elapsed time from last scroll with cursor is shorter than 40ms
    const now = new Date();
    if (lastScrolledDateWithCursor != null && now.getTime() - lastScrolledDateWithCursor.getTime() < 40) {
      return;
    }

    scrollPreviewByEditorLineWithThrottle(line);
  }, [scrollPreviewByEditorLineWithThrottle]);

  /**
   * scroll Preview element by cursor moving
   * @param {number} line
   */
  const scrollPreviewByCursorMoving = useCallback((line: number) => {
    if (previewRef.current == null) {
      return;
    }

    // prevent circular invocation
    if (isOriginOfScrollSyncPreview) {
      isOriginOfScrollSyncPreview = false; // turn off the flag
      return;
    }

    // turn on the flag
    isOriginOfScrollSyncEditor = true;
    if (previewRef.current != null) {
      scrollSyncHelper.scrollPreviewToRevealOverflowing(previewRef.current, line);
    }
  }, []);
  const scrollPreviewByCursorMovingWithThrottle = useMemo(() => throttle(20, scrollPreviewByCursorMoving), [scrollPreviewByCursorMoving]);

  /**
   * the scroll event handler from codemirror
   * @param {number} line
   * @see https://codemirror.net/doc/manual.html#events
   */
  const editorScrollCursorIntoViewHandler = useCallback((line: number) => {
    // record date
    lastScrolledDateWithCursor = new Date();
    scrollPreviewByCursorMovingWithThrottle(line);
  }, [scrollPreviewByCursorMovingWithThrottle]);

  /**
   * scroll Editor component by scroll event of Preview component
   * @param {number} offset
   */
  const scrollEditorByPreviewScroll = useCallback((offset: number) => {
    if (editorRef.current == null || previewRef.current == null) {
      return;
    }

    // prevent circular invocation
    if (isOriginOfScrollSyncEditor) {
      isOriginOfScrollSyncEditor = false; // turn off the flag
      return;
    }

    // turn on the flag
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isOriginOfScrollSyncPreview = true;

    scrollSyncHelper.scrollEditor(editorRef.current, previewRef.current, offset);
  }, []);
  const scrollEditorByPreviewScrollWithThrottle = useMemo(() => throttle(20, scrollEditorByPreviewScroll), [scrollEditorByPreviewScroll]);


  // initial caret line
  useEffect(() => {
    if (editorRef.current != null) {
      editorRef.current.setCaretLine(0);
    }
  }, []);

  // set handler to set caret line
  useEffect(() => {
    const handler = (line) => {
      if (editorRef.current != null) {
        editorRef.current.setCaretLine(line);
      }
      if (previewRef.current != null) {
        scrollSyncHelper.scrollPreview(previewRef.current, line);
      }
    };
    globalEmitter.on('setCaretLine', handler);

    return function cleanup() {
      globalEmitter.removeListener('setCaretLine', handler);
    };
  }, []);


  const saveAndReloadHandler = useCallback(async(opts?: {overwriteScopesOfDescendants: boolean}) => {
    if (editorMode !== EditorMode.Editor) {
      return;
    }

    const grant = grantData?.grant || PageGrant.GRANT_PUBLIC;
    const grantedGroup = grantData?.grantedGroup;

    if (isSlackEnabled == null || currentPathname == null) {
      return;
    }

    let optionsToSave;

    const currentOptionsToSave = getOptionsToSave(isSlackEnabled, slackChannels, grant || 1, grantedGroup?.id, grantedGroup?.name, pageTags || []);

    if (opts != null) {
      optionsToSave = Object.assign(currentOptionsToSave, {
        ...opts,
      });
    }
    else {
      optionsToSave = currentOptionsToSave;
    }

    try {
      await saveAndReload(optionsToSave, { pageId, path: currentPagePath || currentPathname, revisionId: currentPage?.revision?._id }, markdown);
    }
    catch (error) {
      logger.error('failed to save', error);
      // pageContainer.showErrorToastr(error);
      if (error.code === 'conflict') {
        // pageContainer.setState({
        //   remoteRevisionId: error.data.revisionId,
        //   remoteRevisionBody: error.data.revisionBody,
        //   remoteRevisionUpdateAt: error.data.createdAt,
        //   lastUpdateUser: error.data.user,
        // });
      }
    }
  }, [currentPage?.revision?._id,
      currentPagePath,
      currentPathname,
      editorMode,
      grantData?.grant,
      grantData?.grantedGroup,
      isSlackEnabled,
      markdown,
      pageId,
      pageTags,
      slackChannels,
  ]);

  // set handler to save and reload Page
  useEffect(() => {
    globalEmitter.on('saveAndReload', saveAndReloadHandler);

    return function cleanup() {
      globalEmitter.removeListener('saveAndReload', saveAndReloadHandler);
    };
  }, [saveAndReloadHandler]);

  // set handler to focus
  useEffect(() => {
    if (editorRef.current != null && editorMode === EditorMode.Editor) {
      editorRef.current.forceToFocus();
    }
  }, [editorMode]);

  // Unnecessary code. Delete after PageEditor and PageEditorByHackmd implementation has completed. -- 2022.09.06 Yuki Takei
  //
  // set handler to update editor value
  // useEffect(() => {
  //   const handler = (markdown) => {
  //     if (editorRef.current != null) {
  //       editorRef.current.setValue(markdown);
  //     }
  //   };
  //   globalEmitter.on('updateEditorValue', handler);

  //   return function cleanup() {
  //     globalEmitter.removeListener('updateEditorValue', handler);
  //   };
  // }, []);

  // Displays an alert if there is a difference with original markdown body
  useEffect(() => {
    if (initialValue == null || isEnabledUnsavedWarning) {
      return;
    }
    if (initialValue !== markdown) {
      mutateIsEnabledUnsavedWarning(true);
    }
  }, [initialValue, isEnabledUnsavedWarning, markdown, mutateIsEnabledUnsavedWarning]);

  // Detect indent size from contents (only when users are allowed to change it)
  // useEffect(() => {
  //   const currentPageMarkdown = pageContainer.state.markdown;
  //   if (!isIndentSizeForced && currentPageMarkdown != null) {
  //     const detectedIndent = detectIndent(currentPageMarkdown);
  //     if (detectedIndent.type === 'space' && new Set([2, 4]).has(detectedIndent.amount)) {
  //       mutateCurrentIndentSize(detectedIndent.amount);
  //     }
  //   }
  // }, [isIndentSizeForced, mutateCurrentIndentSize, pageContainer.state.markdown]);


  if (!isEditable) {
    return <></>;
  }

  if (rendererOptions == null) {
    return <></>;
  }

  const isUploadable = isUploadableImage || isUploadableFile;

  return (
    <div className="d-flex flex-wrap">
      <div className="page-editor-editor-container flex-grow-1 flex-basis-0 mw-0">
        <Editor
          ref={editorRef}
          value={initialValue}
          isUploadable={isUploadable}
          isUploadableFile={isUploadableFile}
          isTextlintEnabled={isTextlintEnabled}
          indentSize={indentSize}
          onScroll={editorScrolledHandler}
          onScrollCursorIntoView={editorScrollCursorIntoViewHandler}
          onChange={markdownChangedHandler}
          onUpload={uploadHandler}
          onSave={() => saveWithShortcut()}
        />
      </div>
      <div className="d-none d-lg-block page-editor-preview-container flex-grow-1 flex-basis-0 mw-0">
        <Preview
          ref={previewRef}
          rendererOptions={rendererOptions}
          markdown={markdown}
          pagePath={currentPagePath}
          renderMathJaxOnInit={false}
          onScroll={offset => scrollEditorByPreviewScrollWithThrottle(offset)}
        />
      </div>
      {/* <ConflictDiffModal
        isOpen={pageContainer.state.isConflictDiffModalOpen}
        onClose={() => pageContainer.setState({ isConflictDiffModalOpen: false })}
        pageContainer={pageContainer}
        markdownOnEdit={markdown}
      /> */}
    </div>
  );
});
PageEditor.displayName = 'PageEditor';

export default PageEditor;
