'use strict';

module.exports = [
  {
    method: 'PUT',
    path: '/updateSettings',
    handler: 'configurationController.updateSetting',
    config: {
      auth: false,
    },
  },
  {
    method: 'GET',
    path: '/getSettings',
    handler: 'configurationController.getSetting',
    config: {
      auth: false,
    },
  },
  {
    method: 'POST',
    path: '/createProduct',
    handler: 'stripeController.createProduct',
    config: {
      auth: false,
    },
  },
  {
    method: 'GET',
    path: '/getProduct/:offset/:limit/:sort/:order',
    handler: 'stripeController.find',
    config: {
      auth: false,
    },
  },

  {
    method: 'GET',
    path: '/getProduct/:id',
    handler: 'stripeController.findOne',
    config: {
      auth: false,
    },
  },
  {
    method: 'PUT',
    path: '/updateProduct/:id',
    handler: 'stripeController.updateProduct',
    config: {
      auth: false,
    },
  },
  {
    method: 'POST',
    path: '/createCheckoutSession',
    handler: 'stripeController.createCheckoutSession',
    config: {
      auth: false,
    },
  },

  {
    method: 'GET',
    path: '/retrieveCheckoutSession/:id',
    handler: 'stripeController.retrieveCheckoutSession',
    config: {
      auth: false,
    },
  },
  {
    method: 'POST',
    path: '/stripePayment',
    handler: 'stripeController.savePayment',
    config: {
      auth: false,
    },
  },
  {
    method: 'GET',
    path: '/getPayments/:id/:sort/:order/:offset/:limit',
    handler: 'stripeController.getProductPayments',
    config: {
      auth: false,
    },
  },
  {
    method: 'GET',
    path: '/account/:accountId',
    handler: 'stripeController.retrieveAccount',
    config: {
      auth: false,
    },
  },
  {
    method: 'POST',
    path: '/account',
    handler: 'stripeController.createAccount',
    config: {
      auth: false,
    },
  },
  {
    method: 'PUT',
    path: '/account/:accountId',
    handler: 'stripeController.updateAccount',
    config: {
      auth: false,
    },
  },
  {
    method: 'DELETE',
    path: '/account/:accountId',
    handler: 'stripeController.deleteAccount',
    config: {
      auth: false,
    },
  },
  {
    method: 'GET',
    path: '/accountLinks/:accountId',
    handler: 'stripeController.createAccountLink',
    config: {
      auth: false,
    },
  },
];
