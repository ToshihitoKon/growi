import { Container } from 'unstated';

import loggerFactory from '~/utils/logger';

import { apiv3Get } from '../util/apiv3-client';

const logger = loggerFactory('growi:services:EditorContainer');


const defaultEditorOptions = {
  theme: 'elegant',
  keymapMode: 'default',
  styleActiveLine: false,
};

const defaultPreviewOptions = {
  renderMathJaxInRealtime: false,
  renderDrawioInRealtime: true,
};

/**
 * Service container related to options for Editor/Preview
 * @extends {Container} unstated Container
 */
export default class EditorContainer extends Container {

  constructor(appContainer) {
    super();

    this.appContainer = appContainer;
    this.appContainer.registerContainer(this);
    // this.retrieveEditorSettings = this.retrieveEditorSettings.bind(this);

    const mainContent = document.querySelector('#content-main');

    if (mainContent == null) {
      logger.debug('#content-main element is not exists');
      return;
    }

    this.state = {
      tags: null,

      editorOptions: defaultEditorOptions,
      previewOptions: defaultPreviewOptions,

      // Defaults to null to show modal when not in DB
      // isTextlintEnabled: null,
      // textlintRules: [],

      indentSize: this.appContainer.config.adminPreferredIndentSize || 4,
    };

    this.isSetBeforeunloadEventHandler = false;

    this.initDrafts();

  }

  /**
   * Workaround for the mangling in production build to break constructor.name
   */
  static getClassName() {
    return 'EditorContainer';
  }

  /**
   * initialize state for drafts
   */
  initDrafts() {
    this.drafts = {};

    // restore data from localStorage
    const contents = window.localStorage.drafts;
    if (contents != null) {
      try {
        this.drafts = JSON.parse(contents);
      }
      catch (e) {
        window.localStorage.removeItem('drafts');
      }
    }

    if (this.state.pageId == null) {
      const draft = this.findDraft(this.state.path);
      if (draft != null) {
        this.state.markdown = draft;
      }
    }
  }

  setCaretLine(line) {
    const pageEditor = this.appContainer.getComponentInstance('PageEditor');
    if (pageEditor != null) {
      pageEditor.setCaretLine(line);
    }
  }

  focusToEditor() {
    const pageEditor = this.appContainer.getComponentInstance('PageEditor');
    if (pageEditor != null) {
      pageEditor.focusToEditor();
    }
  }

  // TODO: Remove when SWR is complete
  getCurrentOptionsToSave() {
    const opt = {
      // isSlackEnabled: this.state.isSlackEnabled,
      // slackChannels: this.state.slackChannels,
      // grant: this.state.grant,
      pageTags: this.state.tags,
    };

    // if (this.state.grantGroupId != null) {
    //   opt.grantUserGroupId = this.state.grantGroupId;
    // }

    return opt;
  }

  // See https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onbeforeunload#example
  showUnsavedWarning(e) {
    // Cancel the event
    e.preventDefault();
    // display browser default message
    e.returnValue = '';
    return '';
  }

  disableUnsavedWarning() {
    window.removeEventListener('beforeunload', this.showUnsavedWarning);
    this.isSetBeforeunloadEventHandler = false;
  }

  enableUnsavedWarning() {
    if (!this.isSetBeforeunloadEventHandler) {
      window.addEventListener('beforeunload', this.showUnsavedWarning);
      this.isSetBeforeunloadEventHandler = true;
    }
  }

  clearDraft(path) {
    delete this.drafts[path];
    window.localStorage.setItem('drafts', JSON.stringify(this.drafts));
  }

  clearAllDrafts() {
    window.localStorage.removeItem('drafts');
  }

  saveDraft(path, body) {
    this.drafts[path] = body;
    window.localStorage.setItem('drafts', JSON.stringify(this.drafts));
  }

  findDraft(path) {
    if (this.drafts != null && this.drafts[path]) {
      return this.drafts[path];
    }

    return null;
  }

}
