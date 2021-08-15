'use strict';

const stripe = require('stripe')('sk_test_51JOQWjA7MGofgQhkGgPoUNmb6FTq2y8gXxPGHvnhu77mMRjfnLYkRzDerjxmyXztPGtVZNhETEudiREBYp8rWsXa00QS6QJImD')

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {

    async create(ctx) {

        const { tokenStripe, products, idUser, addressShipping } = ctx.request.body;

        let totalPayment = 0.00;

        products.forEach(product => {

            if (product.discount) {

                let discountAmount = (product.price * product.discount) / 100;
                totalPayment += (product.price - discountAmount) * product.quantity;

            } else {

                totalPayment += product.price * product.quantity;

            };

        });

        totalPayment = totalPayment.toFixed(2);

        const charge = await stripe.charges.create({
            amount: (totalPayment * 100).toFixed(0),
            currency: 'MXN',
            source: tokenStripe,
            description: `ID Usuario: ${idUser}`
        });

        const createOrder = [];

        for await (const product of products) {

            let totalProductPayment = 0.00;

            if (product.discount) {

                let discountProductAmount = (product.price * product.discount) / 100;
                totalProductPayment += (product.price - discountProductAmount) * product.quantity;

            } else {

                totalProductPayment += product.price * product.quantity;

            };

            totalProductPayment = totalProductPayment.toFixed(2);

            const data = {
                product: product.id,
                user: idUser,
                totalPayment: totalPayment,
                productsPayment: totalProductPayment,
                quantity: product.quantity,
                idPayment: charge.id,
                addressShipping
            };

            const validData = await strapi.entityValidator.validateEntityCreation(
                strapi.models.order,
                data
            );

            const entry = await strapi.query('order').create(validData);
            createOrder.push(entry);

        };

        return createOrder;
    }

};
