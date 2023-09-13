import { useEffect } from 'react';

import { defaultKeymap } from '@codemirror/commands';
import type { Extension } from '@codemirror/state';
import { keymap, scrollPastEnd } from '@codemirror/view';

import { GlobalCodeMirrorEditorKey } from '../consts';
import { useCodeMirrorEditorIsolated } from '../stores';

import { CodeMirrorEditor } from '.';


const additionalExtensions: Extension[] = [
  scrollPastEnd(),
];


type Props = {
  onChange?: (value: string) => void,
  onSave?: () => void,
}

export const CodeMirrorEditorMain = (props: Props): JSX.Element => {
  const {
    onSave, onChange,
  } = props;

  const { data: codeMirrorEditor } = useCodeMirrorEditorIsolated(GlobalCodeMirrorEditorKey.MAIN);

  // setup additional extensions
  useEffect(() => {
    return codeMirrorEditor?.appendExtensions?.(additionalExtensions);
  }, [codeMirrorEditor]);

  // setup page keymap
  useEffect(() => {
    if (onSave == null) {
      return;
    }

    const keymapExtension = keymap.of([
      {
        // set handler to save with shortcut key
        key: 'Mod-s',
        preventDefault: true,
        run: () => {
          const doc = codeMirrorEditor?.getDoc();
          if (doc != null) {
            onSave();
          }
          return true;
        },
        ...defaultKeymap,
      },
    ]);

    const cleanupFunction = codeMirrorEditor?.appendExtensions?.(keymapExtension);

    return cleanupFunction;
  }, [codeMirrorEditor, onSave]);

  return (
    <CodeMirrorEditor
      editorKey={GlobalCodeMirrorEditorKey.MAIN}
      onChange={onChange}
    />
  );
};
