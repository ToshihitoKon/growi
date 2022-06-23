/* eslint-disable no-unused-vars */
import { advanceTo } from 'jest-date-mock';

import Tag from '~/server/models/tag';

const mongoose = require('mongoose');


const { getInstance } = require('../setup-crowi');

let testUser1;
let testUser2;
let parentTag;
let childTag;

let parentForRename1;
let parentForRename2;
let parentForRename3;
let parentForRename4;
let parentForRename5;
let parentForRename6;
let parentForRename7;
let parentForRename8;
let parentForRename9;

let irrelevantPage1;
let irrelevantPage2;

let childForRename1;
let childForRename2;
let childForRename3;

let parentForDuplicate;

let parentForDelete1;
let parentForDelete2;

let childForDelete;

let parentForDeleteCompletely;

let parentForRevert1;
let parentForRevert2;

let childForDuplicate;
let childForDeleteCompletely;

let childForRevert;

describe('PageService', () => {

  let crowi;
  let Page;
  let Revision;
  let User;
  let PageTagRelation;
  let Bookmark;
  let Comment;
  let ShareLink;
  let xssSpy;

  beforeAll(async() => {
    crowi = await getInstance();
    await crowi.configManager.updateConfigsInTheSameNamespace('crowi', { 'app:isV5Compatible': null });

    User = mongoose.model('User');
    Page = mongoose.model('Page');
    Revision = mongoose.model('Revision');
    PageTagRelation = mongoose.model('PageTagRelation');
    Bookmark = mongoose.model('Bookmark');
    Comment = mongoose.model('Comment');
    ShareLink = mongoose.model('ShareLink');

    await User.insertMany([
      { name: 'someone1', username: 'someone1', email: 'someone1@example.com' },
      { name: 'someone2', username: 'someone2', email: 'someone2@example.com' },
    ]);

    testUser1 = await User.findOne({ username: 'someone1' });
    testUser2 = await User.findOne({ username: 'someone2' });

    await Page.insertMany([
      {
        path: '/parentForRename1',
        grant: Page.GRANT_PUBLIC,
        creator: testUser1,
        lastUpdateUser: testUser1,
      },
      {
        path: '/parentForRename2',
        grant: Page.GRANT_PUBLIC,
        creator: testUser1,
        lastUpdateUser: testUser1,
      },
      {
        path: '/parentForRename3',
        grant: Page.GRANT_PUBLIC,
        creator: testUser1,
        lastUpdateUser: testUser1,
      },
      {
        path: '/parentForRename4',
        grant: Page.GRANT_PUBLIC,
        creator: testUser1,
        lastUpdateUser: testUser1,
      },
      {
        path: '/parentForRename5',
        grant: Page.GRANT_PUBLIC,
        creator: testUser1,
        lastUpdateUser: testUser1,
      },
      {
        path: '/parentForRename6',
        grant: Page.GRANT_PUBLIC,
        creator: testUser1,
        lastUpdateUser: testUser1,
      },
      {
        path: '/level1/level2',
        grant: Page.GRANT_PUBLIC,
        creator: testUser1,
        lastUpdateUser: testUser1,
      },
      {
        path: '/level1/level2/child',
        grant: Page.GRANT_PUBLIC,
        creator: testUser1,
        lastUpdateUser: testUser1,
      },
      {
        path: '/level1/level2/level2',
        grant: Page.GRANT_PUBLIC,
        creator: testUser1,
        lastUpdateUser: testUser1,
      },
      {
        path: '/parentForRename6-2021H1',
        grant: Page.GRANT_PUBLIC,
        creator: testUser1,
        lastUpdateUser: testUser1,
      },
      {
        path: '/level1-2021H1',
        grant: Page.GRANT_PUBLIC,
        creator: testUser1,
        lastUpdateUser: testUser1,
      },
      {
        path: '/parentForRename1/child',
        grant: Page.GRANT_PUBLIC,
        creator: testUser1,
        lastUpdateUser: testUser1,
      },
      {
        path: '/parentForRename2/child',
        grant: Page.GRANT_PUBLIC,
        creator: testUser1,
        lastUpdateUser: testUser1,
      },
      {
        path: '/parentForRename3/child',
        grant: Page.GRANT_PUBLIC,
        creator: testUser1,
        lastUpdateUser: testUser1,
      },
      {
        path: '/parentForDuplicate',
        grant: Page.GRANT_PUBLIC,
        creator: testUser1,
        lastUpdateUser: testUser1,
        revision: '600d395667536503354cbe91',
      },
      {
        path: '/parentForDuplicate/child',
        grant: Page.GRANT_PUBLIC,
        creator: testUser1,
        lastUpdateUser: testUser1,
        revision: '600d395667536503354cbe92',
      },
      {
        path: '/parentForDelete1',
        grant: Page.GRANT_PUBLIC,
        creator: testUser1,
        lastUpdateUser: testUser1,
      },
      {
        path: '/parentForDelete2',
        grant: Page.GRANT_PUBLIC,
        creator: testUser1,
        lastUpdateUser: testUser1,
      },
      {
        path: '/parentForDelete/child',
        grant: Page.GRANT_PUBLIC,
        creator: testUser1,
        lastUpdateUser: testUser1,
      },
      {
        path: '/parentForDeleteCompletely',
        grant: Page.GRANT_PUBLIC,
        creator: testUser1,
        lastUpdateUser: testUser1,
      },
      {
        path: '/parentForDeleteCompletely/child',
        grant: Page.GRANT_PUBLIC,
        creator: testUser1,
        lastUpdateUser: testUser1,
      },
      {
        path: '/trash/parentForRevert1',
        status: Page.STATUS_DELETED,
        grant: Page.GRANT_PUBLIC,
        creator: testUser1,
        lastUpdateUser: testUser1,
      },
      {
        path: '/trash/parentForRevert2',
        status: Page.STATUS_DELETED,
        grant: Page.GRANT_PUBLIC,
        creator: testUser1,
        lastUpdateUser: testUser1,
      },
      {
        path: '/trash/parentForRevert/child',
        status: Page.STATUS_DELETED,
        grant: Page.GRANT_PUBLIC,
        creator: testUser1,
        lastUpdateUser: testUser1,
      },
    ]);

    parentForRename1 = await Page.findOne({ path: '/parentForRename1' });
    parentForRename2 = await Page.findOne({ path: '/parentForRename2' });
    parentForRename3 = await Page.findOne({ path: '/parentForRename3' });
    parentForRename4 = await Page.findOne({ path: '/parentForRename4' });
    parentForRename5 = await Page.findOne({ path: '/parentForRename5' });
    parentForRename6 = await Page.findOne({ path: '/parentForRename6' });
    parentForRename7 = await Page.findOne({ path: '/level1/level2' });
    parentForRename8 = await Page.findOne({ path: '/level1/level2/child' });
    parentForRename9 = await Page.findOne({ path: '/level1/level2/level2' });

    irrelevantPage1 = await Page.findOne({ path: '/parentForRename6-2021H1' });
    irrelevantPage2 = await Page.findOne({ path: '/level1-2021H1' });

    parentForDuplicate = await Page.findOne({ path: '/parentForDuplicate' });

    parentForDelete1 = await Page.findOne({ path: '/parentForDelete1' });
    parentForDelete2 = await Page.findOne({ path: '/parentForDelete2' });

    parentForDeleteCompletely = await Page.findOne({ path: '/parentForDeleteCompletely' });
    parentForRevert1 = await Page.findOne({ path: '/trash/parentForRevert1' });
    parentForRevert2 = await Page.findOne({ path: '/trash/parentForRevert2' });

    childForRename1 = await Page.findOne({ path: '/parentForRename1/child' });
    childForRename2 = await Page.findOne({ path: '/parentForRename2/child' });
    childForRename3 = await Page.findOne({ path: '/parentForRename3/child' });

    childForDuplicate = await Page.findOne({ path: '/parentForDuplicate/child' });
    childForDelete = await Page.findOne({ path: '/parentForDelete/child' });
    childForDeleteCompletely = await Page.findOne({ path: '/parentForDeleteCompletely/child' });
    childForRevert = await Page.findOne({ path: '/trash/parentForRevert/child' });


    await Tag.insertMany([
      { name: 'Parent' },
      { name: 'Child' },
    ]);

    parentTag = await Tag.findOne({ name: 'Parent' });
    childTag = await Tag.findOne({ name: 'Child' });

    await PageTagRelation.insertMany([
      { relatedPage: parentForDuplicate, relatedTag: parentTag },
      { relatedPage: childForDuplicate, relatedTag: childTag },
    ]);

    await Revision.insertMany([
      {
        _id: '600d395667536503354cbe91',
        pageId: parentForDuplicate._id,
        body: 'duplicateBody',
      },
      {
        _id: '600d395667536503354cbe92',
        pageId: childForDuplicate._id,
        body: 'duplicateChildBody',
      },
    ]);

    xssSpy = jest.spyOn(crowi.xss, 'process').mockImplementation(path => path);
  });

  describe('rename page without using renameDescendantsWithStreamSpy', () => {
    test('rename page with different tree with isRecursively [deeper]', async() => {
      const resultPage = await crowi.pageService.renamePage(parentForRename6, '/parentForRename6/renamedChild', testUser1, { isRecursively: true });
      const wrongPage = await Page.findOne({ path: '/parentForRename6/renamedChild/renamedChild' });
      const expectPage1 = await Page.findOne({ path: '/parentForRename6/renamedChild' });
      const expectPage2 = await Page.findOne({ path: '/parentForRename6-2021H1' });

      expect(resultPage.path).toEqual(expectPage1.path);
      expect(expectPage2.path).not.toBeNull();

      // Check that pages that are not to be renamed have not been renamed
      expect(wrongPage).toBeNull();
    });

    test('rename page with different tree with isRecursively [shallower]', async() => {
      // setup
      expect(await Page.findOne({ path: '/level1' })).toBeNull();
      expect(await Page.findOne({ path: '/level1/level2' })).not.toBeNull();
      expect(await Page.findOne({ path: '/level1/level2/child' })).not.toBeNull();
      expect(await Page.findOne({ path: '/level1/level2/level2' })).not.toBeNull();
      expect(await Page.findOne({ path: '/level1-2021H1' })).not.toBeNull();

      // when
      //   rename /level1/level2 --> /level1
      await crowi.pageService.renamePage(parentForRename7, '/level1', testUser1, { isRecursively: true });

      // then
      expect(await Page.findOne({ path: '/level1' })).not.toBeNull();
      expect(await Page.findOne({ path: '/level1/child' })).not.toBeNull();
      expect(await Page.findOne({ path: '/level1/level2' })).not.toBeNull();
      expect(await Page.findOne({ path: '/level1/level2/child' })).toBeNull();
      expect(await Page.findOne({ path: '/level1/level2/level2' })).toBeNull();

      // Check that pages that are not to be renamed have not been renamed
      expect(await Page.findOne({ path: '/level1-2021H1' })).not.toBeNull();
    });
  });

  describe('rename page', () => {
    let pageEventSpy;
    let renameDescendantsWithStreamSpy;
    // mock new Date() and Date.now()
    advanceTo(new Date(2000, 1, 1, 0, 0, 0));
    const dateToUse = new Date();

    beforeEach(async() => {
      pageEventSpy = jest.spyOn(crowi.pageService.pageEvent, 'emit').mockImplementation();
      renameDescendantsWithStreamSpy = jest.spyOn(crowi.pageService, 'renameDescendantsWithStream').mockImplementation();
    });

    describe('renamePage()', () => {

      test('rename page without options', async() => {

        const resultPage = await crowi.pageService.renamePage(parentForRename1, '/renamed1', testUser2, {});

        expect(xssSpy).toHaveBeenCalled();

        expect(pageEventSpy).toHaveBeenCalledWith('rename', parentForRename1, testUser2, null);

        expect(resultPage.path).toBe('/renamed1');
        expect(resultPage.updatedAt).toEqual(parentForRename1.updatedAt);
        expect(resultPage.lastUpdateUser).toEqual(testUser1._id);
      });

      test('rename page with updateMetadata option', async() => {

        const resultPage = await crowi.pageService.renamePage(parentForRename2, '/renamed2', testUser2, { updateMetadata: true });

        expect(xssSpy).toHaveBeenCalled();

        expect(pageEventSpy).toHaveBeenCalledWith('rename', parentForRename2, testUser2, null);

        expect(resultPage.path).toBe('/renamed2');
        expect(resultPage.updatedAt).toEqual(dateToUse);
        expect(resultPage.lastUpdateUser).toEqual(testUser2._id);
      });

      test('rename page with createRedirectPage option', async() => {

        const resultPage = await crowi.pageService.renamePage(parentForRename3, '/renamed3', testUser2, { createRedirectPage: true });

        expect(xssSpy).toHaveBeenCalled();
        expect(pageEventSpy).toHaveBeenCalledWith('rename', parentForRename3, testUser2, null);

        expect(resultPage.path).toBe('/renamed3');
        expect(resultPage.updatedAt).toEqual(parentForRename3.updatedAt);
        expect(resultPage.lastUpdateUser).toEqual(testUser1._id);
      });

      test('rename page with isRecursively', async() => {

        const resultPage = await crowi.pageService.renamePage(parentForRename4, '/renamed4', testUser2, { isRecursively: true });

        expect(xssSpy).toHaveBeenCalled();
        expect(renameDescendantsWithStreamSpy).toHaveBeenCalled();
        expect(pageEventSpy).toHaveBeenCalledWith('rename', parentForRename4, testUser2, null);

        expect(resultPage.path).toBe('/renamed4');
        expect(resultPage.updatedAt).toEqual(parentForRename4.updatedAt);
        expect(resultPage.lastUpdateUser).toEqual(testUser1._id);
      });

      test('rename page with different tree with isRecursively', async() => {

        const resultPage = await crowi.pageService.renamePage(parentForRename5, '/parentForRename5/renamedChild', testUser1, { isRecursively: true });
        const wrongPage = await Page.findOne({ path: '/parentForRename5/renamedChild/renamedChild' });
        const expectPage = await Page.findOne({ path: '/parentForRename5/renamedChild' });

        expect(resultPage.path).toEqual(expectPage.path);
        expect(wrongPage).toBeNull();
      });

    });

    test('renameDescendants without options', async() => {
      const oldPagePathPrefix = new RegExp('^/parentForRename1', 'i');
      const newPagePathPrefix = '/renamed1';

      await crowi.pageService.renameDescendants([childForRename1], testUser2, {}, oldPagePathPrefix, newPagePathPrefix);
      const resultPage = await Page.findOne({ path: '/renamed1/child' });

      expect(resultPage).not.toBeNull();
      expect(pageEventSpy).toHaveBeenCalledWith('updateMany', [childForRename1], testUser2);

      expect(resultPage.path).toBe('/renamed1/child');
      expect(resultPage.updatedAt).toEqual(childForRename1.updatedAt);
      expect(resultPage.lastUpdateUser).toEqual(testUser1._id);
    });

    test('renameDescendants with updateMetadata option', async() => {
      const oldPagePathPrefix = new RegExp('^/parentForRename2', 'i');
      const newPagePathPrefix = '/renamed2';

      await crowi.pageService.renameDescendants([childForRename2], testUser2, { updateMetadata: true }, oldPagePathPrefix, newPagePathPrefix);
      const resultPage = await Page.findOne({ path: '/renamed2/child' });

      expect(resultPage).not.toBeNull();
      expect(pageEventSpy).toHaveBeenCalledWith('updateMany', [childForRename2], testUser2);

      expect(resultPage.path).toBe('/renamed2/child');
      expect(resultPage.updatedAt).toEqual(dateToUse);
      expect(resultPage.lastUpdateUser).toEqual(testUser2._id);
    });

    test('renameDescendants with createRedirectPage option', async() => {
      const oldPagePathPrefix = new RegExp('^/parentForRename3', 'i');
      const newPagePathPrefix = '/renamed3';

      await crowi.pageService.renameDescendants([childForRename3], testUser2, { createRedirectPage: true }, oldPagePathPrefix, newPagePathPrefix);
      const resultPage = await Page.findOne({ path: '/renamed3/child' });

      expect(resultPage).not.toBeNull();
      expect(pageEventSpy).toHaveBeenCalledWith('updateMany', [childForRename3], testUser2);

      expect(resultPage.path).toBe('/renamed3/child');
      expect(resultPage.updatedAt).toEqual(childForRename3.updatedAt);
      expect(resultPage.lastUpdateUser).toEqual(testUser1._id);
    });
  });

  describe('duplicate page', () => {
    let duplicateDescendantsWithStreamSpy;

    // TODO https://redmine.weseek.co.jp/issues/87537 : activate outer module mockImplementation
    // jest.mock('~/server/models/serializers/page-serializer');
    // const { serializePageSecurely } = require('~/server/models/serializers/page-serializer');
    // serializePageSecurely.mockImplementation(page => page);

    beforeEach(async() => {
      duplicateDescendantsWithStreamSpy = jest.spyOn(crowi.pageService, 'duplicateDescendantsWithStream').mockImplementation();
    });

    test('duplicate page (isRecursively: false)', async() => {
      const dummyId = '600d395667536503354c9999';
      crowi.models.Page.findRelatedTagsById = jest.fn().mockImplementation(() => { return parentTag });
      const originTagsMock = jest.spyOn(Page, 'findRelatedTagsById').mockImplementation(() => { return parentTag });
      jest.spyOn(PageTagRelation, 'updatePageTags').mockImplementation(() => { return [dummyId, parentTag.name] });
      jest.spyOn(PageTagRelation, 'listTagNamesByPage').mockImplementation(() => { return [parentTag.name] });

      const resultPage = await crowi.pageService.duplicate(parentForDuplicate, '/newParentDuplicate', testUser2, false);
      const duplicatedToPageRevision = await Revision.findOne({ pageId: resultPage._id });

      expect(xssSpy).toHaveBeenCalled();
      expect(duplicateDescendantsWithStreamSpy).not.toHaveBeenCalled();
      // TODO https://redmine.weseek.co.jp/issues/87537 : activate outer module mockImplementation
      // expect(serializePageSecurely).toHaveBeenCalled();
      expect(resultPage.path).toBe('/newParentDuplicate');
      expect(resultPage.lastUpdateUser._id).toEqual(testUser2._id);
      expect(duplicatedToPageRevision._id).not.toEqual(parentForDuplicate.revision._id);
      expect(resultPage.grant).toEqual(parentForDuplicate.grant);
      expect(resultPage.tags).toEqual([originTagsMock().name]);
    });

    test('duplicate page (isRecursively: true)', async() => {
      const dummyId = '600d395667536503354c9999';
      crowi.models.Page.findRelatedTagsById = jest.fn().mockImplementation(() => { return parentTag });
      const originTagsMock = jest.spyOn(Page, 'findRelatedTagsById').mockImplementation(() => { return parentTag });
      jest.spyOn(PageTagRelation, 'updatePageTags').mockImplementation(() => { return [dummyId, parentTag.name] });
      jest.spyOn(PageTagRelation, 'listTagNamesByPage').mockImplementation(() => { return [parentTag.name] });

      const resultPageRecursivly = await crowi.pageService.duplicate(parentForDuplicate, '/newParentDuplicateRecursively', testUser2, true);
      const duplicatedRecursivelyToPageRevision = await Revision.findOne({ pageId: resultPageRecursivly._id });

      expect(xssSpy).toHaveBeenCalled();
      expect(duplicateDescendantsWithStreamSpy).toHaveBeenCalled();
      // TODO https://redmine.weseek.co.jp/issues/87537 : activate outer module mockImplementation
      // expect(serializePageSecurely).toHaveBeenCalled();
      expect(resultPageRecursivly.path).toBe('/newParentDuplicateRecursively');
      expect(resultPageRecursivly.lastUpdateUser._id).toEqual(testUser2._id);
      expect(duplicatedRecursivelyToPageRevision._id).not.toEqual(parentForDuplicate.revision._id);
      expect(resultPageRecursivly.grant).toEqual(parentForDuplicate.grant);
      expect(resultPageRecursivly.tags).toEqual([originTagsMock().name]);
    });

    test('duplicateDescendants()', async() => {
      const duplicateTagsMock = await jest.spyOn(crowi.pageService, 'duplicateTags').mockImplementationOnce();
      await crowi.pageService.duplicateDescendants([childForDuplicate], testUser2, parentForDuplicate.path, '/newPathPrefix');

      const childForDuplicateRevision = await Revision.findOne({ pageId: childForDuplicate._id });
      const insertedPage = await Page.findOne({ path: '/newPathPrefix/child' });
      const insertedRevision = await Revision.findOne({ pageId: insertedPage._id });

      expect(insertedPage).not.toBeNull();
      expect(insertedPage.path).toEqual('/newPathPrefix/child');
      expect(insertedPage.lastUpdateUser).toEqual(testUser2._id);

      expect([insertedRevision]).not.toBeNull();
      expect(insertedRevision.pageId).toEqual(insertedPage._id);
      expect(insertedRevision._id).not.toEqual(childForDuplicateRevision._id);
      expect(insertedRevision.body).toEqual(childForDuplicateRevision.body);

      expect(duplicateTagsMock).toHaveBeenCalled();
    });

    test('duplicateTags()', async() => {
      const pageIdMapping = {
        [parentForDuplicate._id]: '60110bdd85339d7dc732dddd',
      };
      const duplicateTagsReturn = await crowi.pageService.duplicateTags(pageIdMapping);
      const parentoForDuplicateTag = await PageTagRelation.findOne({ relatedPage: parentForDuplicate._id });
      expect(duplicateTagsReturn).toHaveLength(1);
      expect(duplicateTagsReturn[0].relatedTag).toEqual(parentoForDuplicateTag.relatedTag);
    });
  });

  describe.only('delete page', () => {
    let getDeletedPageNameSpy;
    let pageEventSpy;
    let deleteDescendantsWithStreamSpy;
    const dateToUse = new Date('2000-01-01');

    beforeEach(async() => {
      jest.spyOn(global.Date, 'now').mockImplementation(() => dateToUse);
      getDeletedPageNameSpy = jest.spyOn(Page, 'getDeletedPageName');
      pageEventSpy = jest.spyOn(crowi.pageService.pageEvent, 'emit');
      deleteDescendantsWithStreamSpy = jest.spyOn(crowi.pageService, 'deleteDescendantsWithStream').mockImplementation();
    });

    test('delete page without options', async() => {
      const resultPage = await crowi.pageService.deletePage(parentForDelete1, testUser2, { });

      expect(getDeletedPageNameSpy).toHaveBeenCalled();
      expect(deleteDescendantsWithStreamSpy).not.toHaveBeenCalled();

      expect(resultPage.status).toBe(Page.STATUS_DELETED);
      expect(resultPage.path).toBe('/trash/parentForDelete1');
      expect(resultPage.deleteUser).toEqual(testUser2._id);
      expect(resultPage.deletedAt).toEqual(dateToUse);
      expect(resultPage.updatedAt).toEqual(parentForDelete1.updatedAt);
      expect(resultPage.lastUpdateUser).toEqual(testUser1._id);

      expect(pageEventSpy).toHaveBeenCalledWith('delete', parentForDelete1, testUser2, null);
      expect(pageEventSpy).toHaveBeenCalledWith('create', resultPage, testUser2);
    });

    test('delete page with isRecursively', async() => {
      const resultPage = await crowi.pageService.deletePage(parentForDelete2, testUser2, { }, true);

      expect(getDeletedPageNameSpy).toHaveBeenCalled();
      expect(deleteDescendantsWithStreamSpy).toHaveBeenCalled();

      expect(resultPage.status).toBe(Page.STATUS_DELETED);
      expect(resultPage.path).toBe('/trash/parentForDelete2');
      expect(resultPage.deleteUser).toEqual(testUser2._id);
      expect(resultPage.deletedAt).toEqual(dateToUse);
      expect(resultPage.updatedAt).toEqual(parentForDelete2.updatedAt);
      expect(resultPage.lastUpdateUser).toEqual(testUser1._id);

      expect(pageEventSpy).toHaveBeenCalledWith('delete', parentForDelete2, testUser2, null);
      expect(pageEventSpy).toHaveBeenCalledWith('create', resultPage, testUser2);
    });


    test('deleteDescendants', async() => {
      await crowi.pageService.deleteDescendants([childForDelete], testUser2);
      const resultPage = await Page.findOne({ path: '/trash/parentForDelete/child' });

      expect(resultPage.status).toBe(Page.STATUS_DELETED);
      expect(resultPage.path).toBe('/trash/parentForDelete/child');
      expect(resultPage.deleteUser).toEqual(testUser2._id);
      expect(resultPage.deletedAt).toEqual(dateToUse);
      expect(resultPage.updatedAt).toEqual(childForDelete.updatedAt);
      expect(resultPage.lastUpdateUser).toEqual(testUser1._id);
    });
  });

  describe('delete page completely', () => {
    let pageEventSpy;
    let deleteCompletelyOperationSpy;
    let deleteCompletelyDescendantsWithStreamSpy;

    let deleteManyBookmarkSpy;
    let deleteManyCommentSpy;
    let deleteManyPageTagRelationSpy;
    let deleteManyShareLinkSpy;
    let deleteManyRevisionSpy;
    let deleteManyPageSpy;
    let removeAllAttachmentsSpy;

    beforeEach(async() => {
      pageEventSpy = jest.spyOn(crowi.pageService.pageEvent, 'emit');
      deleteCompletelyOperationSpy = jest.spyOn(crowi.pageService, 'deleteCompletelyOperation');
      deleteCompletelyDescendantsWithStreamSpy = jest.spyOn(crowi.pageService, 'deleteCompletelyDescendantsWithStream').mockImplementation();

      deleteManyBookmarkSpy = jest.spyOn(Bookmark, 'deleteMany').mockImplementation();
      deleteManyCommentSpy = jest.spyOn(Comment, 'deleteMany').mockImplementation();
      deleteManyPageTagRelationSpy = jest.spyOn(PageTagRelation, 'deleteMany').mockImplementation();
      deleteManyShareLinkSpy = jest.spyOn(ShareLink, 'deleteMany').mockImplementation();
      deleteManyRevisionSpy = jest.spyOn(Revision, 'deleteMany').mockImplementation();
      deleteManyPageSpy = jest.spyOn(Page, 'deleteMany').mockImplementation();
      removeAllAttachmentsSpy = jest.spyOn(crowi.attachmentService, 'removeAllAttachments').mockImplementation();
    });

    test('deleteCompletelyOperation', async() => {
      await crowi.pageService.deleteCompletelyOperation([parentForDeleteCompletely._id], [parentForDeleteCompletely.path], { });

      expect(deleteManyBookmarkSpy).toHaveBeenCalledWith({ page: { $in: [parentForDeleteCompletely._id] } });
      expect(deleteManyCommentSpy).toHaveBeenCalledWith({ page: { $in: [parentForDeleteCompletely._id] } });
      expect(deleteManyPageTagRelationSpy).toHaveBeenCalledWith({ relatedPage: { $in: [parentForDeleteCompletely._id] } });
      expect(deleteManyShareLinkSpy).toHaveBeenCalledWith({ relatedPage: { $in: [parentForDeleteCompletely._id] } });
      expect(deleteManyRevisionSpy).toHaveBeenCalledWith({ pageId: { $in: [parentForDeleteCompletely._id] } });
      expect(deleteManyPageSpy).toHaveBeenCalledWith({ _id: { $in: [parentForDeleteCompletely._id] } });
      expect(removeAllAttachmentsSpy).toHaveBeenCalled();
    });

    test('delete completely without options', async() => {
      await crowi.pageService.deleteCompletely(parentForDeleteCompletely, testUser2, { });

      expect(deleteCompletelyOperationSpy).toHaveBeenCalled();
      expect(deleteCompletelyDescendantsWithStreamSpy).not.toHaveBeenCalled();

      expect(pageEventSpy).toHaveBeenCalledWith('deleteCompletely', parentForDeleteCompletely, testUser2);
    });


    test('delete completely with isRecursively', async() => {
      await crowi.pageService.deleteCompletely(parentForDeleteCompletely, testUser2, { }, true);

      expect(deleteCompletelyOperationSpy).toHaveBeenCalled();
      expect(deleteCompletelyDescendantsWithStreamSpy).toHaveBeenCalled();

      expect(pageEventSpy).toHaveBeenCalledWith('deleteCompletely', parentForDeleteCompletely, testUser2);
    });
  });

  describe('revert page', () => {
    let getRevertDeletedPageNameSpy;
    let findByPathSpy;
    let findSpy;
    let deleteCompletelySpy;
    let revertDeletedDescendantsWithStreamSpy;

    beforeEach(async() => {
      getRevertDeletedPageNameSpy = jest.spyOn(Page, 'getRevertDeletedPageName');
      deleteCompletelySpy = jest.spyOn(crowi.pageService, 'deleteCompletely').mockImplementation();
      revertDeletedDescendantsWithStreamSpy = jest.spyOn(crowi.pageService, 'revertDeletedDescendantsWithStream').mockImplementation();
    });

    test('revert deleted page when the redirect from page exists', async() => {
      const resultPage = await crowi.pageService.revertDeletedPage(parentForRevert1, testUser2);

      expect(getRevertDeletedPageNameSpy).toHaveBeenCalledWith(parentForRevert1.path);
      expect(revertDeletedDescendantsWithStreamSpy).not.toHaveBeenCalled();

      expect(resultPage.path).toBe('/parentForRevert1');
      expect(resultPage.lastUpdateUser._id).toEqual(testUser2._id);
      expect(resultPage.status).toBe(Page.STATUS_PUBLISHED);
      expect(resultPage.deleteUser).toBeNull();
      expect(resultPage.deletedAt).toBeNull();
    });

    test('revert deleted page when the redirect from page does not exist', async() => {

      findByPathSpy = jest.spyOn(Page, 'findByPath').mockImplementation(() => {
        return null;
      });

      const resultPage = await crowi.pageService.revertDeletedPage(parentForRevert2, testUser2, {}, true);

      expect(getRevertDeletedPageNameSpy).toHaveBeenCalledWith(parentForRevert2.path);
      expect(findByPathSpy).toHaveBeenCalledWith('/parentForRevert2');
      expect(deleteCompletelySpy).not.toHaveBeenCalled();
      expect(revertDeletedDescendantsWithStreamSpy).toHaveBeenCalled();

      expect(resultPage.path).toBe('/parentForRevert2');
      expect(resultPage.lastUpdateUser._id).toEqual(testUser2._id);
      expect(resultPage.status).toBe(Page.STATUS_PUBLISHED);
      expect(resultPage.deleteUser).toBeNull();
      expect(resultPage.deletedAt).toBeNull();
    });

    test('revert deleted descendants', async() => {
      await crowi.pageService.revertDeletedDescendants([childForRevert], testUser2);
      const resultPage = await Page.findOne({ path: '/parentForRevert/child' });
      const revrtedFromPage = await Page.findOne({ path: '/trash/parentForRevert/child' });
      const revrtedFromPageRevision = await Revision.findOne({ pageId: resultPage._id });

      expect(getRevertDeletedPageNameSpy).toHaveBeenCalledWith(childForRevert.path);

      expect(resultPage.path).toBe('/parentForRevert/child');
      expect(resultPage.lastUpdateUser._id).toEqual(testUser2._id);
      expect(resultPage.status).toBe(Page.STATUS_PUBLISHED);
      expect(resultPage.deleteUser).toBeNull();
      expect(resultPage.deletedAt).toBeNull();

      expect(revrtedFromPage).toBeNull();
      expect(revrtedFromPageRevision).toBeNull();
    });
  });

});
