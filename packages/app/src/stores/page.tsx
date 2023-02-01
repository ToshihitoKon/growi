import { useEffect } from 'react';

import type {
  IPageInfoForEntity, IPagePopulatedToShowRevision, Nullable,
} from '@growi/core';
import { isClient, pagePathUtils } from '@growi/core';
import useSWR, { mutate, SWRResponse } from 'swr';
import useSWRImmutable from 'swr/immutable';
import useSWRMutation, { SWRMutationResponse } from 'swr/mutation';

import { apiGet } from '~/client/util/apiv1-client';
import { apiv3Get } from '~/client/util/apiv3-client';
import {
  IPageInfo, IPageInfoForOperation,
} from '~/interfaces/page';
import { IRecordApplicableGrant, IResIsGrantNormalized } from '~/interfaces/page-grant';
import { IRevisionsForPagination } from '~/interfaces/revision';

import { IPageTagsInfo } from '../interfaces/tag';

import {
  useCurrentPageId, useCurrentPathname, useShareLinkId, useIsGuestUser,
} from './context';
import { ITermNumberManagerUtil, useTermNumberManager } from './use-static-swr';

const { isPermalink: _isPermalink } = pagePathUtils;


export const useSWRxCurrentPage = (initialData?: IPagePopulatedToShowRevision|null): SWRResponse<IPagePopulatedToShowRevision|null> => {
  const key = 'currentPage';

  useEffect(() => {
    if (initialData !== undefined) {
      mutate(key, initialData, {
        optimisticData: initialData,
        populateCache: true,
        revalidate: false,
      });
    }
  }, [initialData, key]);

  return useSWR(key, null, {
    keepPreviousData: true,
  });
};

export const useSWRMUTxCurrentPage = (): SWRMutationResponse<IPagePopulatedToShowRevision|null> => {
  const key = 'currentPage';

  const { data: currentPageId } = useCurrentPageId();
  const { data: shareLinkId } = useShareLinkId();

  // Get URL parameter for specific revisionId
  let revisionId: string|undefined;
  if (isClient()) {
    const urlParams = new URLSearchParams(window.location.search);
    const requestRevisionId = urlParams.get('revisionId');
    revisionId = requestRevisionId != null ? requestRevisionId : undefined;
  }

  return useSWRMutation(
    key,
    async() => {
      return apiv3Get<{ page: IPagePopulatedToShowRevision }>('/page', { pageId: currentPageId, shareLinkId, revisionId })
        .then(result => result.data.page)
        .catch((errs) => {
          if (!Array.isArray(errs)) { throw Error('error is not array') }
          const statusCode = errs[0].status;
          if (statusCode === 403 || statusCode === 404) {
            // for NotFoundPage
            return null;
          }
          throw Error('failed to get page');
        });
    },
    {
      populateCache: true,
      revalidate: false,
    },
  );
};

export const useSWRxPageByPath = (path?: string): SWRResponse<IPagePopulatedToShowRevision, Error> => {
  return useSWR(
    path != null ? ['/page', path] : null,
    ([endpoint, path]) => apiv3Get<{ page: IPagePopulatedToShowRevision }>(endpoint, { path }).then(result => result.data.page),
  );
};

export const useSWRxTagsInfo = (pageId: Nullable<string>): SWRResponse<IPageTagsInfo | undefined, Error> => {
  const { data: shareLinkId } = useShareLinkId();

  const endpoint = `/pages.getPageTag?pageId=${pageId}`;

  return useSWRImmutable(
    shareLinkId == null && pageId != null ? [endpoint, pageId] : null,
    ([endpoint, pageId]) => apiGet<IPageTagsInfo>(endpoint, { pageId }).then(result => result),
  );
};

export const usePageInfoTermManager = (isDisabled?: boolean) : SWRResponse<number, Error> & ITermNumberManagerUtil => {
  return useTermNumberManager(isDisabled === true ? null : 'pageInfoTermNumber');
};

export const useSWRxPageInfo = (
    pageId: string | null | undefined,
    shareLinkId?: string | null,
    initialData?: IPageInfoForEntity,
): SWRResponse<IPageInfo | IPageInfoForOperation, Error> => {

  const { data: termNumber } = usePageInfoTermManager();

  // assign null if shareLinkId is undefined in order to identify SWR key only by pageId
  const fixedShareLinkId = shareLinkId ?? null;

  const swrResult = useSWRImmutable(
    pageId != null && termNumber != null ? ['/page/info', pageId, fixedShareLinkId, termNumber] : null,
    ([endpoint, pageId, shareLinkId]) => apiv3Get(endpoint, { pageId, shareLinkId }).then(response => response.data),
    { fallbackData: initialData },
  );

  return swrResult;
};

export const useSWRxPageRevisions = (
    page: number, // page number of pagination
    limit: number, // max number of pages in one paginate
    pageId: string | null | undefined,
): SWRResponse<IRevisionsForPagination, Error> => {

  return useSWRImmutable(
    ['/revisions/list', pageId, page, limit],
    ([endpoint, pageId, page, limit]) => {
      return apiv3Get(endpoint, { pageId, page, limit }).then((response) => {
        const revisions = {
          revisions: response.data.docs,
          totalCounts: response.data.totalDocs,
        };
        return revisions;
      });
    },
  );
};

/*
 * Grant normalization fetching hooks
 */
export const useSWRxIsGrantNormalized = (
    pageId: string | null | undefined,
): SWRResponse<IResIsGrantNormalized, Error> => {

  const { data: isGuestUser } = useIsGuestUser();

  const key = !isGuestUser && pageId != null ? ['/page/is-grant-normalized', pageId] : null;

  return useSWRImmutable(
    key,
    ([endpoint, pageId]) => apiv3Get(endpoint, { pageId }).then(response => response.data),
  );
};

export const useSWRxApplicableGrant = (
    pageId: string | null | undefined,
): SWRResponse<IRecordApplicableGrant, Error> => {

  return useSWRImmutable(
    pageId != null ? ['/page/applicable-grant', pageId] : null,
    ([endpoint, pageId]) => apiv3Get(endpoint, { pageId }).then(response => response.data),
  );
};


/** **********************************************************
 *                     Computed states
 *********************************************************** */

export const useCurrentPagePath = (): SWRResponse<string | undefined, Error> => {
  const { data: currentPage } = useSWRxCurrentPage();
  const { data: currentPathname } = useCurrentPathname();

  return useSWRImmutable(
    ['currentPagePath', currentPage?.path, currentPathname],
    ([, , pathname]) => {
      if (currentPage?.path != null) {
        return currentPage.path;
      }
      if (pathname != null && !_isPermalink(pathname)) {
        return pathname;
      }
      return undefined;
    },
    // TODO: set fallbackData
    // { fallbackData:  }
  );
};

export const useIsTrashPage = (): SWRResponse<boolean, Error> => {
  const { data: pagePath } = useCurrentPagePath();

  return useSWRImmutable(
    pagePath == null ? null : ['isTrashPage', pagePath],
    ([, pagePath]) => pagePathUtils.isTrashPage(pagePath),
    // TODO: set fallbackData
    // { fallbackData:  }
  );
};
