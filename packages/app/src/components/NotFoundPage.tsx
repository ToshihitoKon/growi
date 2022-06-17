import React, { useMemo, useEffect } from 'react';

import { useTranslation } from 'react-i18next';
import urljoin from 'url-join';

import { useCurrentPageId, useCurrentPagePath, useNotFoundTargetPathOrId } from '~/stores/context';

import CustomNavAndContents from './CustomNavigation/CustomNavAndContents';
import { DescendantsPageListForCurrentPath } from './DescendantsPageList';
import PageListIcon from './Icons/PageListIcon';
import TimeLineIcon from './Icons/TimeLineIcon';
import PageTimeline from './PageTimeline';

/**
 * Replace url in address bar with new path and query parameters
 */
const replaceURLHistory = (path: string) => {
  const queryParameters = window.location.search;
  window.history.replaceState(null, '', urljoin(path, queryParameters));
};

const NotFoundPage = (): JSX.Element => {
  const { t } = useTranslation();
  const { data: pageId } = useCurrentPageId();
  const { data: path } = useCurrentPagePath();
  const { data: notFoundTargetPathOrId } = useNotFoundTargetPathOrId();

  // replace url in address bar with path when accessing empty page by permalink
  useEffect(() => {
    const isEmptyPage = pageId != null;
    const isPathExist = path != null;
    const isPathLink = notFoundTargetPathOrId?.includes('/');

    if (isEmptyPage && isPathExist && !isPathLink) {
      replaceURLHistory(path);
    }
  }, [pageId, path, notFoundTargetPathOrId]);

  const navTabMapping = useMemo(() => {
    return {
      pagelist: {
        Icon: PageListIcon,
        Content: DescendantsPageListForCurrentPath,
        i18n: t('page_list'),
        index: 0,
      },
      timeLine: {
        Icon: TimeLineIcon,
        Content: PageTimeline,
        i18n: t('Timeline View'),
        index: 1,
      },
    };
  }, [t]);


  return (
    <div className="d-edit-none">
      <CustomNavAndContents navTabMapping={navTabMapping} tabContentClasses={['py-4']} />
    </div>
  );
};

export default NotFoundPage;
