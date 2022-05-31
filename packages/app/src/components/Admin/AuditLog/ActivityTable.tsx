import React, { FC } from 'react';

import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

import { IActivityHasId } from '~/interfaces/activity';

type Props = {
  activityList: IActivityHasId[]
}

const formatDate = (date) => {
  return format(new Date(date), 'yyyy/MM/dd HH:mm:ss');
};

export const ActivityTable : FC<Props> = (props: Props) => {
  const { t } = useTranslation();

  return (
    <div className="table-responsive text-nowrap h-100">
      <table className="table table-default table-bordered table-user-list">
        <thead>
          <tr>
            <th scope="col">{t('admin:audit_log_management.username')}</th>
            <th scope="col">{t('admin:audit_log_management.target_model')}</th>
            <th scope="col">{t('admin:audit_log_management.action')}</th>
            <th scope="col">{t('admin:audit_log_management.date')}</th>
          </tr>
        </thead>
        <tbody>
          {props.activityList.map((activity) => {
            return (
              <tr data-testid="activity-table" key={activity._id}>
                <td>{activity.snapshot?.username}</td>
                <td>{activity.targetModel}</td>
                <td>{activity.action}</td>
                <td>{formatDate(activity.createdAt)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
