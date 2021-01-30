// Set your secret key. Remember to switch to your live secret key in production!
// See your keys here: https://dashboard.stripe.com/account/apikeys
const Stripe = require('stripe');
const stripe = Stripe('sk_test_51IDtdsCFbMmCdmOJ5qmy08l62J0hBgGNxknmlRsqHXVxGJTn5n7VuMwKBoQfwK0r9qvenZdO3Ctomi2rwzxqutFU005tqyQDDe');

module.exports = stripe;