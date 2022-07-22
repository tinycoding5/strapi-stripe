'use strict';

const Stripe = require('stripe');

module.exports = ({ strapi }) => ({
  async createProduct(
    title,
    productPrice,
    imageId,
    imageUrl,
    description,
    isSubscription,
    paymentInterval,
    trialPeriodDays,
    priceCurrency = ''
  ) {
    const pluginStore = strapi.store({
      environment: strapi.config.environment,
      type: 'plugin',
      name: 'strapi-stripe',
    });

    const stripeSettings = await pluginStore.get({ key: 'stripeSetting' });
    let stripe;
    if (stripeSettings.isLiveMode) {
      stripe = new Stripe(stripeSettings.stripeLiveSecKey);
    } else {
      stripe = new Stripe(stripeSettings.stripeTestSecKey);
    }

    let product;
    if (imageUrl) {
      product = await stripe.products.create({
        name: title,
        description,
        images: [imageUrl],
      });
    } else {
      product = await stripe.products.create({
        name: title,
        description
      });
    }


    const currency = priceCurrency ? priceCurrency : stripeSettings.currency;

    const createproduct = async (productId, priceId, planId) => {
      const create = await strapi.query('plugin::strapi-stripe.strapi-stripe-product').create({
        data: {
          title,
          description,
          price: productPrice,
          currency,
          productImage: imageId,
          isSubscription,
          interval: paymentInterval,
          trialPeriodDays,
          stripeProductId: productId,
          stripePriceId: priceId,
          stripePlanId: planId,
        },
        populate: true,
      });
      return create;
    };

    if (isSubscription) {
      const plan = await stripe.plans.create({
        amount: productPrice * 100,
        currency,
        interval: paymentInterval,
        product: product.id,
        trial_period_days: trialPeriodDays,
      });
      createproduct(product.id, '', plan.id);
    } else {
      const price = await stripe.prices.create({
        unit_amount: productPrice * 100,
        currency,
        product: product.id,
      });
      createproduct(product.id, price.id, '');
    }
    return product;
  },
  async updateProduct(id, title, url, description, productImage, stripeProductId) {
    const pluginStore = strapi.store({
      environment: strapi.config.environment,
      type: 'plugin',
      name: 'strapi-stripe',
    });
    const stripeSettings = await pluginStore.get({ key: 'stripeSetting' });
    let stripe;
    if (stripeSettings.isLiveMode) {
      stripe = new Stripe(stripeSettings.stripeLiveSecKey);
    } else {
      stripe = new Stripe(stripeSettings.stripeTestSecKey);
    }

    if (url) {
      await stripe.products.update(stripeProductId, {
        name: title,
        description,
        images: [url],
      });
    } else {
      await stripe.products.update(stripeProductId, {
        name: title,
        description
      });
    }

    if (productImage && productImage.id) {
      const updateProductResponse = await strapi
        .query('plugin::strapi-stripe.strapi-stripe-product')
        .update({
          where: { id },
          data: {
            title,
            description,
            productImage,
          },
        });
      return updateProductResponse;
    } else {
      const updateProductResponse = await strapi
        .query('plugin::strapi-stripe.strapi-stripe-product')
        .update({
          where: { id },
          data: {
            title,
            description
          },
        });
      return updateProductResponse;
    }

  },
  async retrieveProduct(productId) {
    const pluginStore = strapi.store({
      environment: strapi.config.environment,
      type: 'plugin',
      name: 'strapi-stripe',
    });
    const stripeSettings = await pluginStore.get({ key: 'stripeSetting' });
    let stripe;
    if (stripeSettings.isLiveMode) {
      stripe = new Stripe(stripeSettings.stripeLiveSecKey);
    } else {
      stripe = new Stripe(stripeSettings.stripeTestSecKey);
    }

    const product = await stripe.products.retrieve(productId);
    return product;
  },
  async createCheckoutSession(stripePriceId, stripePlanId, isSubscription, productId, productName) {
    const pluginStore = strapi.store({
      environment: strapi.config.environment,
      type: 'plugin',
      name: 'strapi-stripe',
    });
    const stripeSettings = await pluginStore.get({ key: 'stripeSetting' });
    let stripe;
    if (stripeSettings.isLiveMode) {
      stripe = new Stripe(stripeSettings.stripeLiveSecKey);
    } else {
      stripe = new Stripe(stripeSettings.stripeTestSecKey);
    }
    let priceId;
    let paymentMode;
    if (isSubscription) {
      priceId = stripePlanId;
      paymentMode = 'subscription';
    } else {
      priceId = stripePriceId;
      paymentMode = 'payment';
    }
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
          price: priceId,
          quantity: 1,
        },
      ],
      mode: paymentMode,
      payment_method_types: ['card'],
      success_url: `${stripeSettings.checkoutSuccessUrl}?sessionId={CHECKOUT_SESSION_ID}`,
      cancel_url: `${stripeSettings.checkoutCancelUrl}`,
      metadata: {
        productId: `${productId}`,
        productName: `${productName}`,
      },
    });
    return session;
  },
  async createConnectedCheckoutSession(isSubscription, productId, productName, amount, currency = 'usd', accountId, courseId, priceId = '') {
    const pluginStore = strapi.store({
      environment: strapi.config.environment,
      type: 'plugin',
      name: 'strapi-stripe',
    });
    const stripeSettings = await pluginStore.get({ key: 'stripeSetting' });
    let stripe;
    if (stripeSettings.isLiveMode) {
      stripe = new Stripe(stripeSettings.stripeLiveSecKey);
    } else {
      stripe = new Stripe(stripeSettings.stripeTestSecKey);
    }
    let paymentMode;
    if (isSubscription) {
      paymentMode = 'subscription';
    } else {
      paymentMode = 'payment';
    }

    const applicationFee = parseFloat(amount) * parseFloat(stripeSettings.applicationFee) / 100;

    if (priceId) {
      const session = await stripe.checkout.sessions.create({
        line_items: [{
          price: priceId,
          quantity: 1,
        }],
        mode: paymentMode,
        payment_method_types: ['card'],
        success_url: `${stripeSettings.checkoutSuccessUrl}?sessionId={CHECKOUT_SESSION_ID}`,
        cancel_url: `${stripeSettings.checkoutCancelUrl}`,
        payment_intent_data: {
          application_fee_amount: applicationFee,
          transfer_data: {
            destination: `${accountId}`,
          },
        },
        metadata: {
          productId: `${productId}`,
          productName: `${productName}`,
          courseId: `${courseId}`
        },
      });

      return session;
    } else {
      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price_data: {
              currency,
              product: productId,
              unit_amount: amount,
            },
            quantity: 1,
          }
        ],
        mode: paymentMode,
        payment_method_types: ['card'],
        success_url: `${stripeSettings.checkoutSuccessUrl}?sessionId={CHECKOUT_SESSION_ID}`,
        cancel_url: `${stripeSettings.checkoutCancelUrl}`,
        payment_intent_data: {
          application_fee_amount: applicationFee,
          transfer_data: {
            destination: `${accountId}`,
          },
        },
        metadata: {
          productId: `${productId}`,
          productName: `${productName}`,
          courseId: `${courseId}`
        },
      });

      return session;
    }
  },
  async retrieveCheckoutSession(checkoutSessionId) {
    const pluginStore = strapi.store({
      environment: strapi.config.environment,
      type: 'plugin',
      name: 'strapi-stripe',
    });
    const stripeSettings = await pluginStore.get({ key: 'stripeSetting' });
    let stripe;
    if (stripeSettings.isLiveMode) {
      stripe = new Stripe(stripeSettings.stripeLiveSecKey);
    } else {
      stripe = new Stripe(stripeSettings.stripeTestSecKey);
    }
    const session = await stripe.checkout.sessions.retrieve(checkoutSessionId);
    return session;
  },
  async createAccount(accountType = 'express') {
    const pluginStore = strapi.store({
      environment: strapi.config.environment,
      type: 'plugin',
      name: 'strapi-stripe',
    })

    const stripeSettings = await pluginStore.get({ key: 'stripeSetting' });
    let stripe;
    if (stripeSettings.isLiveMode) {
      stripe = new Stripe(stripeSettings.stripeLiveSecKey);
    } else {
      stripe = new Stripe(stripeSettings.stripeTestSecKey);
    }

    const account = await stripe.accounts.create({ type: accountType });
    return account;
  },
  async retrieveAccount(accountId) {
    const pluginStore = strapi.store({
      environment: strapi.config.environment,
      type: 'plugin',
      name: 'strapi-stripe',
    })

    const stripeSettings = await pluginStore.get({ key: 'stripeSetting' });
    let stripe;
    if (stripeSettings.isLiveMode) {
      stripe = new Stripe(stripeSettings.stripeLiveSecKey);
    } else {
      stripe = new Stripe(stripeSettings.stripeTestSecKey);
    }

    const account = await stripe.accounts.retrieve(accountId);
    return account;
  },
  async deleteAccount(accountId) {
    const pluginStore = strapi.store({
      environment: strapi.config.environment,
      type: 'plugin',
      name: 'strapi-stripe',
    })

    const stripeSettings = await pluginStore.get({ key: 'stripeSetting' });
    let stripe;
    if (stripeSettings.isLiveMode) {
      stripe = new Stripe(stripeSettings.stripeLiveSecKey);
    } else {
      stripe = new Stripe(stripeSettings.stripeTestSecKey);
    }
    const deleted = await stripe.accounts.del(accountId);
    return deleted;
  },
  async updateAccount(accountId, data) {
    const pluginStore = strapi.store({
      environment: strapi.config.environment,
      type: 'plugin',
      name: 'strapi-stripe',
    })

    const stripeSettings = await pluginStore.get({ key: 'stripeSetting' });
    let stripe;
    if (stripeSettings.isLiveMode) {
      stripe = new Stripe(stripeSettings.stripeLiveSecKey);
    } else {
      stripe = new Stripe(stripeSettings.stripeTestSecKey);
    }

    const account = await stripe.accounts.update(accountId, data);
    return account;
  },
  async accountLinks(accountId) {
    const pluginStore = strapi.store({
      environment: strapi.config.environment,
      type: 'plugin',
      name: 'strapi-stripe',
    })

    const stripeSettings = await pluginStore.get({ key: 'stripeSetting' });
    let stripe;
    if (stripeSettings.isLiveMode) {
      stripe = new Stripe(stripeSettings.stripeLiveSecKey);
    } else {
      stripe = new Stripe(stripeSettings.stripeTestSecKey);
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: stripeSettings.accountLinkRefreshUrl,
      return_url: stripeSettings.accountLinkReturnUrl,
      type: 'account_onboarding',
    });

    return accountLink;
  },
  async createPaymentIntent(amount, currency = 'usd', accountId) {
    const pluginStore = strapi.store({
      environment: strapi.config.environment,
      type: 'plugin',
      name: 'strapi-stripe',
    });
    const stripeSettings = await pluginStore.get({ key: 'stripeSetting' });
    let stripe;
    if (stripeSettings.isLiveMode) {
      stripe = new Stripe(stripeSettings.stripeLiveSecKey);
    } else {
      stripe = new Stripe(stripeSettings.stripeTestSecKey);
    }

    const accountFee = parseFloat(stripeSettings.applicationFee) * amount / 100;

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      application_fee_amount: accountFee,
      transfer_data: {
        destination: accountId,
      },
    });

    return paymentIntent;
  }
});
