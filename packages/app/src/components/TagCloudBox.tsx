import React, { FC, memo } from 'react';

import Link from 'next/link';

import { IDataTagCount } from '~/interfaces/tag';


type Props = {
  tags:IDataTagCount[],
  minSize?: number,
  maxSize?: number,
  maxTagTextLength?: number,
  isDisableRandomColor?: boolean,
};

const defaultProps = {
  isDisableRandomColor: true,
};

const MAX_TAG_TEXT_LENGTH = 8;

const TagCloudBox: FC<Props> = memo((props:(Props & typeof defaultProps)) => {
  const { tags } = props;
  const maxTagTextLength: number = props.maxTagTextLength ?? MAX_TAG_TEXT_LENGTH;

  const tagElements = tags.map((tag:IDataTagCount) => {
    const tagNameFormat = (tag.name).length > maxTagTextLength ? `${(tag.name).slice(0, maxTagTextLength)}...` : tag.name;
    const queryParam = `tag:${tag.name}`;
    return (
      <Link
        key={tag.name} href={`/_search?q=${encodeURIComponent(queryParam)}`} className="grw-tag-label badge badge-secondary mr-2"
      >
        <a>
          {tagNameFormat}
        </a>
      </Link>
    );
  });

  return (
    <div className="grw-popular-tag-labels">
      {tagElements}
    </div>
  );

});

TagCloudBox.displayName = 'withLoadingSppiner';

TagCloudBox.defaultProps = defaultProps;

export default TagCloudBox;
