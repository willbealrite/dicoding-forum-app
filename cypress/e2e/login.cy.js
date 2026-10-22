describe('E2E Login', () => {
  beforeEach(() => {
    cy.clearLocalStorage();

    cy.intercept('POST', '**/v1/login', {
      statusCode: 200,
      body: {
        status: 'success',
        message: 'Login berhasil',
        data: {
          token: 'cypress-test-token',
        },
      },
    }).as('loginRequest');

    cy.intercept('GET', '**/v1/users/me', {
      statusCode: 200,
      body: {
        status: 'success',
        message: 'Profil berhasil diambil',
        data: {
          user: {
            id: 'user-cypress-1',
            name: 'Pengguna Cypress',
            email: 'cypress@example.com',
          },
        },
      },
    }).as('profileRequest');
  });

  it('berhasil login dan berpindah ke halaman utama', () => {
    cy.visit('/login');

    cy.get('#login-email')
      .should('be.visible')
      .type('cypress@example.com');

    cy.get('#login-password')
      .should('be.visible')
      .type('password123');

    cy.contains('button', 'Login').click();

    cy.wait('@loginRequest')
      .its('request.body')
      .should('deep.equal', {
        email: 'cypress@example.com',
        password: 'password123',
      });

    cy.wait('@profileRequest');

    cy.location('pathname').should('eq', '/');
    cy.getAllLocalStorage().should((storage) => {
      expect(storage[window.location.origin].accessToken)
        .to.equal('cypress-test-token');
    });
  });
});
