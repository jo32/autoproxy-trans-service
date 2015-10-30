#!/usr/bin/env node
'use strict';

var _regeneratorRuntime = require('babel-runtime/regenerator')['default'];

var _Object$keys = require('babel-runtime/core-js/object/keys')['default'];

var express = require('express');
var app = express();
var autoproxy2pac = require('autoproxy2pac');
var Q = require('q');
var fs = require('fs');
var path = require('path');

function log(message) {
    if (Object.prototype.toString.apply(message) == '[object Error]') {
        console.error('[ERROR] ' + message.message);
        console.error(message.stack);
        return;
    }
    console.log('[INFO] ' + message);
}

function genTemplateGetter(isPrecise) {
    var pac = {
        content: null
    };
    // cleaning cache every 30min
    function updatePac() {
        var temp;
        return _regeneratorRuntime.async(function updatePac$(context$2$0) {
            while (1) switch (context$2$0.prev = context$2$0.next) {
                case 0:
                    context$2$0.next = 2;
                    return _regeneratorRuntime.awrap(autoproxy2pac.genPac({
                        proxy: '__PROXY__',
                        precise: isPrecise
                    }));

                case 2:
                    temp = context$2$0.sent;

                    if (temp) {
                        pac.content = null;
                        log('cleaned cache of precise mode: ' + isPrecise);
                        pac.content = temp;
                        log('generated cache of precise mode: ' + isPrecise);
                    } else {
                        log('failed generating cache of precise mode: ' + isPrecise);
                    }

                case 4:
                case 'end':
                    return context$2$0.stop();
            }
        }, null, this);
    }
    updatePac();
    setInterval(updatePac, 1000 * 60 * 60);

    return function callee$1$0() {
        return _regeneratorRuntime.async(function callee$1$0$(context$2$0) {
            while (1) switch (context$2$0.prev = context$2$0.next) {
                case 0:
                    return context$2$0.abrupt('return', pac.content);

                case 1:
                case 'end':
                    return context$2$0.stop();
            }
        }, null, this);
    };
}

var getApnpTemplate = (function () {

    var template = null;

    return function callee$1$0() {
        return _regeneratorRuntime.async(function callee$1$0$(context$2$0) {
            while (1) switch (context$2$0.prev = context$2$0.next) {
                case 0:
                    if (!template) {
                        context$2$0.next = 2;
                        break;
                    }

                    return context$2$0.abrupt('return', template);

                case 2:
                    context$2$0.next = 4;
                    return _regeneratorRuntime.awrap(Q.nfcall(fs.readFile, path.join(__dirname, '../resources/apnp.mobileconfig'), 'utf-8'));

                case 4:
                    template = context$2$0.sent;
                    return context$2$0.abrupt('return', template);

                case 6:
                case 'end':
                    return context$2$0.stop();
            }
        }, null, this);
    };
})();

var fastPacGetter = genTemplateGetter(false);
var precisePacGetter = genTemplateGetter(true);

app.get('/proxy.pac', function (req, res, next) {

    var proxy = req.query.proxy;
    var precise = req.query.precise;

    if (!proxy) {
        var err = new Error('proxy is empty');
        err.status = 403;
        return next(err);
    }

    precise = precise == 'true' ? true : false;

    (function callee$1$0() {
        var pac;
        return _regeneratorRuntime.async(function callee$1$0$(context$2$0) {
            while (1) switch (context$2$0.prev = context$2$0.next) {
                case 0:
                    context$2$0.prev = 0;
                    pac = null;

                    if (precise) {
                        context$2$0.next = 8;
                        break;
                    }

                    context$2$0.next = 5;
                    return _regeneratorRuntime.awrap(fastPacGetter());

                case 5:
                    pac = context$2$0.sent;
                    context$2$0.next = 11;
                    break;

                case 8:
                    context$2$0.next = 10;
                    return _regeneratorRuntime.awrap(precisePacGetter());

                case 10:
                    pac = context$2$0.sent;

                case 11:
                    pac = pac.replace('__PROXY__', proxy);
                    res.type('application/x-ns-proxy-autoconfig').send(pac);
                    return context$2$0.abrupt('return', next());

                case 16:
                    context$2$0.prev = 16;
                    context$2$0.t0 = context$2$0['catch'](0);
                    return context$2$0.abrupt('return', next(context$2$0.t0));

                case 19:
                case 'end':
                    return context$2$0.stop();
            }
        }, null, this, [[0, 16]]);
    })();
});

app.get('/apnp.mobileconfig', function (req, res, next) {

    var server = req.query.server;
    var port = req.query.port;

    if (!server || !port) {
        var err = new Error('parameter server or port is not given');
        err.status = 403;
        return next(err);
    }

    (function callee$1$0() {
        var template, config;
        return _regeneratorRuntime.async(function callee$1$0$(context$2$0) {
            while (1) switch (context$2$0.prev = context$2$0.next) {
                case 0:
                    context$2$0.prev = 0;
                    context$2$0.next = 3;
                    return _regeneratorRuntime.awrap(getApnpTemplate());

                case 3:
                    template = context$2$0.sent;
                    config = template.replace(/__SERVER__/g, server).replace(/__PORT__/g, port);

                    res.type('application/x-apple-aspen-config').send(config);
                    return context$2$0.abrupt('return', next());

                case 9:
                    context$2$0.prev = 9;
                    context$2$0.t0 = context$2$0['catch'](0);
                    return context$2$0.abrupt('return', next(context$2$0.t0));

                case 12:
                case 'end':
                    return context$2$0.stop();
            }
        }, null, this, [[0, 9]]);
    })();
});

app.get('/rules.surge', function (req, res, next) {

    (function callee$1$0() {
        var pac, func, domains;
        return _regeneratorRuntime.async(function callee$1$0$(context$2$0) {
            while (1) switch (context$2$0.prev = context$2$0.next) {
                case 0:
                    context$2$0.prev = 0;
                    context$2$0.next = 3;
                    return _regeneratorRuntime.awrap(fastPacGetter());

                case 3:
                    pac = context$2$0.sent;
                    func = new Function(pac + '\n' + 'return domains;');
                    domains = func();

                    res.type('text/plain').send(_Object$keys(domains).map(function (val) {
                        return ['DOMAIN-SUFFIX', val, 'Proxy'].join(',');
                    }).join('\n'));
                    return context$2$0.abrupt('return', next());

                case 10:
                    context$2$0.prev = 10;
                    context$2$0.t0 = context$2$0['catch'](0);
                    return context$2$0.abrupt('return', next(context$2$0.t0));

                case 13:
                case 'end':
                    return context$2$0.stop();
            }
        }, null, this, [[0, 10]]);
    })();
});

app.use(function (err, req, res, next) {
    if (err) {
        log(err);
        res.status(err.status || 500).json({
            status: err.status || 500,
            msg: err.message
        });
    }
    return next(err);
});

var server = app.listen(11082, '0.0.0.0', function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log('Example app listening at http://%s:%s', host, port);
});