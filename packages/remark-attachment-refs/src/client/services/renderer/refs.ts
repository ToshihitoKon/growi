import { pathUtils } from '@growi/core';
import { remarkGrowiDirectivePluginType } from '@growi/remark-growi-directive';
import { Schema as SanitizeOption } from 'hast-util-sanitize';
import { selectAll, HastNode } from 'hast-util-select';
import isAbsolute from 'is-absolute-url';
import { Plugin } from 'unified';
import { visit } from 'unist-util-visit';

const REF_NAME_PATTERN = new RegExp(/refimg|ref/);
const REFS_NAME_PATTERN = new RegExp(/refsimg|refs/);
const REF_SUPPORTED_ATTRIBUTES = ['file', 'id', 'page', 'fileNameOrId', 'pagePath'];
const REF_IMG_SUPPORTED_ATTRIBUTES = ['file', 'id', 'page', 'width', 'height', 'max-width', 'max-height', 'alt', 'pagePath'];
const REFS_SUPPORTED_ATTRIBUTES = ['page', 'prefix', 'depth', 'regexp', 'pagePath'];
const REFS_IMG_SUPPORTED_ATTRIBUTES = [
  'page', 'prefix', 'depth', 'regexp', 'width', 'height', 'max-width', 'max-height', 'display', 'grid', 'grid-gap', 'no-carousel', 'pagePath',
];

const { hasHeadingSlash } = pathUtils;

type DirectiveAttributes = Record<string, string>

export const remarkPlugin: Plugin = function() {
  return (tree) => {
    visit(tree, (node) => {
      if (node.type === remarkGrowiDirectivePluginType.Text || node.type === remarkGrowiDirectivePluginType.Leaf) {
        if (typeof node.name !== 'string') {
          return;
        }
        const data = node.data ?? (node.data = {});
        const attributes = node.attributes as DirectiveAttributes || {};
        const attrEntries = Object.entries(attributes);

        if (REF_NAME_PATTERN.test(node.name)) {
          // determine fileNameOrId
          // order:
          //   1: ref(file=..., ...)
          //   2: ref(id=..., ...)
          //   3: refs(firstArgs, ...)
          let fileNameOrId: string = attributes.file || attributes.id;
          if (fileNameOrId == null && attrEntries.length > 0) {
            const [firstAttrKey, firstAttrValue] = attrEntries[0];
            fileNameOrId = (firstAttrValue === '' && !REF_SUPPORTED_ATTRIBUTES.concat(REF_IMG_SUPPORTED_ATTRIBUTES).includes(firstAttrValue))
              ? firstAttrKey : '';
          }
          attributes.fileNameOrId = fileNameOrId;
        }
        else if (REFS_NAME_PATTERN.test(node.name)) {
          // set 'page' attribute if the first attribute is only value
          // e.g.
          //   case 1: refs(page=/path..., ...)    => page="/path"
          //   case 2: refs(/path, ...)            => page="/path"
          //   case 3: refs(/foo, page=/bar ...)   => page="/bar"
          if (attributes.page == null && attrEntries.length > 0) {
            const [firstAttrKey, firstAttrValue] = attrEntries[0];

            if (firstAttrValue === '' && !REFS_SUPPORTED_ATTRIBUTES.concat(REFS_IMG_SUPPORTED_ATTRIBUTES).includes(firstAttrValue)) {
              attributes.page = firstAttrKey;
            }
          }
        }
        else {
          return;
        }

        data.hName = node.name;
        data.hProperties = attributes;
      }
    });
  };
};

const pathResolver = (href: string, basePath: string): string => {
  // exclude absolute URL
  if (isAbsolute(href)) {
    // remove scheme
    return href.replace(/^(.+?):\/\//, '/');
  }

  // generate relative pathname
  const baseUrl = new URL(pathUtils.addTrailingSlash(basePath), 'https://example.com');
  const relativeUrl = new URL(href, baseUrl);

  return relativeUrl.pathname;
};


type RefRehypePluginParams = {
  pagePath?: string,
}

export const rehypePlugin: Plugin<[RefRehypePluginParams]> = (options = {}) => {
  if (options.pagePath == null) {
    throw new Error('refs rehype plugin requires \'pagePath\' option');
  }

  return (tree) => {
    if (options.pagePath == null) {
      return;
    }

    const basePagePath = options.pagePath;
    const elements = selectAll('ref, refimg, refs, refsimg', tree as HastNode);

    elements.forEach((refElem) => {
      if (refElem.properties == null) {
        return;
      }

      refElem.properties.pagePath = refElem.properties.page;
      const pagePath = refElem.properties.pag1ePath;

      // set basePagePath when pagePath is undefined or invalid
      if (pagePath == null || typeof pagePath !== 'string') {
        refElem.properties.pagePath = basePagePath;
        return;
      }

      // return when page is already determined and aboslute path
      if (hasHeadingSlash(pagePath)) {
        return;
      }

      // resolve relative path
      refElem.properties.pagePath = decodeURI(pathResolver(pagePath, basePagePath));
    });
  };
};

export const sanitizeOption: SanitizeOption = {
  tagNames: ['ref', 'refimg', 'refs', 'refsimg'],
  attributes: {
    ref: REF_SUPPORTED_ATTRIBUTES,
    refimg: REF_IMG_SUPPORTED_ATTRIBUTES,
    refs: REFS_SUPPORTED_ATTRIBUTES,
    refsimg: REFS_IMG_SUPPORTED_ATTRIBUTES,
  },
};
