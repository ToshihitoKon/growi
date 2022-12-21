context('Access to pagelist', () => {
  const ssPrefix = 'access-to-pagelist-';
  beforeEach(() => {
    // login
    cy.fixture("user-admin.json").then(user => {
      cy.login(user.username, user.password);
    });
  });

  it('Page list modal is successfully opened ', () => {
    cy.visit('/');
    cy.waitUntilSkeletonDisappear();
    cy.collapseSidebar(true);

    cy.getByTestid('pageListButton').click({force: true});
    cy.getByTestid('page-accessories-modal').parent().should('have.class','show');
    cy.getByTestid('page-list-item-L').should('be.visible');

    // Wait until the string "You cannot see this page" is no longer displayed
    cy.getByTestid('page-list-item-L').eq(0).within(() => {
      cy.get('.icon-exclamation').should('not.exist');
    });

    cy.screenshot(`${ssPrefix}1-open-pagelist-modal`);
  });

  it('Successfully duplicate a page from page list', () => {
    cy.visit('/');
    cy.getByTestid('pageListButton').click({force: true});
    cy.getByTestid('page-accessories-modal').parent().should('have.class','show').within(() => {
      cy.getByTestid('open-page-item-control-btn').first().click();
      cy.getByTestid('page-item-control-menu').should('have.class', 'show').first().within(() => {
        // eslint-disable-next-line cypress/no-unnecessary-waiting
        cy.wait(300);
        cy.screenshot(`${ssPrefix}2-open-page-item-control-menu`);
        cy.getByTestid('open-page-duplicate-modal-btn').click();
      });
    });
    cy.getByTestid('page-duplicate-modal').should('be.visible').screenshot(`${ssPrefix}3-duplicate-page-modal-opened`);
    cy.getByTestid('page-duplicate-modal').should('be.visible').within(() => {
      cy.get('.rbt-input-main').type('-duplicate', {force: true})
    }).screenshot(`${ssPrefix}4-input-duplicated-page-name`);
    cy.getByTestid('page-duplicate-modal').should('be.visible').within(() => {
      cy.get('.modal-footer > button').click();
    });
    cy.get('body').type('{esc}');
    cy.getByTestid('pageListButton').click({force: true});
    cy.getByTestid('page-accessories-modal').parent().should('have.class','show').within(() => {
      cy.get('.list-group-item').eq(0).within(() => {
        cy.screenshot(`${ssPrefix}5-duplicated-page`);
      });
    });
  });

  it('Successfully expand and close modal', () => {
    cy.visit('/');
    cy.waitUntilSkeletonDisappear();
    cy.collapseSidebar(true);

    cy.getByTestid('pageListButton').click({force: true});
    cy.getByTestid('page-accessories-modal').parent().should('have.class','show');
    cy.getByTestid('page-list-item-L').should('be.visible');

    // Wait until the string "You cannot see this page" is no longer displayed
    cy.getByTestid('page-list-item-L').eq(0).within(() => {
      cy.get('.icon-exclamation').should('not.exist');
    });

    cy.screenshot(`${ssPrefix}6-page-list-modal-size-normal`);
    cy.getByTestid('page-accessories-modal').parent().should('have.class','show').within(() => {
      cy.get('button.close').eq(0).click();
    });

    cy.screenshot(`${ssPrefix}7-page-list-modal-size-fullscreen`);

    cy.getByTestid('page-accessories-modal').parent().should('have.class','show').within(() => {
      cy.get('button.close').eq(1).click();
    });

    cy.collapseSidebar(true);
    cy.screenshot(`${ssPrefix}8-close-page-list-modal`);
  });
});

context('Access to timeline', () => {
  const ssPrefix = 'access-to-timeline-';
  beforeEach(() => {
    // login
    cy.fixture("user-admin.json").then(user => {
      cy.login(user.username, user.password);
    });
  });
  it('Timeline list successfully openend', () => {
    cy.visit('/');
    cy.collapseSidebar(true);

    cy.getByTestid('pageListButton').click({force: true});
    cy.getByTestid('page-accessories-modal').parent().should('have.class','show').within(() => {
      cy.get('.nav-title > li').eq(1).find('a').click();
    });
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500); // wait for loading wiki
    cy.screenshot(`${ssPrefix}1-timeline-list`);
  });

  it('Successfully expand and close modal', () => {
    cy.visit('/');
    cy.collapseSidebar(true);

    cy.getByTestid('pageListButton').click({force: true});
    cy.getByTestid('page-accessories-modal').parent().should('have.class','show').within(() => {
      cy.get('.nav-title > li').eq(1).find('a').click();
      cy.get('button.close').eq(0).click();
    });
    cy.get('.modal').should('be.visible');
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500); // wait for loading wiki
    cy.screenshot(`${ssPrefix}2-timeline-list-fullscreen`);
    cy.getByTestid('page-accessories-modal').parent().should('have.class','show').within(() => {
      cy.get('button.close').eq(1).click();
    });
    cy.screenshot(`${ssPrefix}3-close-modal`);
  });
});