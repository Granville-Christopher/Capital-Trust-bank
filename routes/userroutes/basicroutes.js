const express = require('express');
const router = express.Router();

router.get('/cards', async (req, res) => {
    return res.status(200).render('user/cards');
});

router.get('/confirmtransfer', async (req, res) => {
    return res.status(200).render('user/confirmtransfer');
});

router.get('/creditcard', async (req, res) => {
    return res.status(200).render('user/creditcard');
});

router.get('/debitcard', async (req, res) => {
    return res.status(200).render('user/debitcard');
});

router.get('/customerservicecenter', async (req, res) => {
    return res.status(200).render('user/customerservicecenter');
});

router.get('/dashboard', async (req, res) => {
    return res.status(200).render('user/dashboard');
});

router.get('/finance', async (req, res) => {
    return res.status(200).render('user/finance');
});

router.get('/internationaltransfer', async (req, res) => {
    return res.status(200).render('user/internationaltransfer');
});

router.get('/localtransfer', async (req, res) => {
    return res.status(200).render('user/localtransfer');
});

router.get('/settings', async (req, res) => {
    return res.status(200).render('user/settings');
});

router.get('/transactionhistory', async (req, res) => {
    return res.status(200).render('user/transactionhistory');
});

router.get('/profile', async (req, res) => {
    return res.status(200).render('user/profile');
});

module.exports = router;