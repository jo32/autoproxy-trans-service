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
    async function updatePac() {
        var temp = await autoproxy2pac.genPac({
            proxy: '__PROXY__',
            precise: isPrecise
        });
        if (temp) {
            pac.content = null;
            log(`cleaned cache of precise mode: ${isPrecise}`);
            pac.content = temp;
            log(`generated cache of precise mode: ${isPrecise}`);
        } else {
            log(`failed generating cache of precise mode: ${isPrecise}`);
        }
    }
    updatePac();
    setInterval(updatePac, 1000 * 60 * 60);

    return async function() {
        return pac.content;
    }
}

var getApnpTemplate = (function() {

    var template = null;

    return async function() {
        if (template) {
            return template;
        }

        template = await Q.nfcall(fs.readFile, path.join(__dirname, '../resources/apnp.mobileconfig'), 'utf-8');
        return template;
    };

})();

var fastPacGetter = genTemplateGetter(false);
var precisePacGetter = genTemplateGetter(true);

app.get('/proxy.pac', function(req, res, next) {

    var proxy = req.query.proxy;
    var precise = req.query.precise;

    if (!proxy) {
        var err = new Error('proxy is empty');
        err.status = 403;
        return next(err);
    }

    precise = precise == 'true' ? true : false;

    (async function() {
        try {
            var pac = null;
            if (!precise) {
                pac = await fastPacGetter();
            } else {
                pac = await precisePacGetter();
            }
            pac = pac.replace('__PROXY__', proxy);
            res.type('application/x-ns-proxy-autoconfig').send(pac);
            return next();
        } catch (e) {
            return next(e);
        }
    })();
});

app.get('/apnp.mobileconfig', function(req, res, next) {

    var server = req.query.server;
    var port = req.query.port;

    if (!server || !port) {
        var err = new Error('parameter server or port is not given');
        err.status = 403;
        return next(err);
    }

    (async function() {
        try {
            var template = await getApnpTemplate();
            var config = template.replace(/__SERVER__/g, server).replace(/__PORT__/g, port);
            res.type('application/x-apple-aspen-config').send(config);
            return next();
        } catch (e) {
            return next(e);
        }
    })();

});

app.get('/rules.surge', function(req, res, next) {

    (async function() {
        try {
            var pac = await fastPacGetter();
            var func = new Function(pac + '\n' + 'return domains;');
            var domains = func();
            res.type('text/plain').send(Object.keys(domains).map(function(val) {
                return ['DOMAIN-SUFFIX', val, 'Proxy'].join(',');
            }).join('\n'));
            return next();
        } catch (e) {
            return next(e);
        }
    })();
});

app.use(function(err, req, res, next) {
    if (err) {
        log(err);
        res.status(err.status || 500).json({
            status: err.status || 500,
            msg: err.message
        });
    }
    return next(err);
});

var server = app.listen(11082, '0.0.0.0', function() {
    var host = server.address().address;
    var port = server.address().port;
    console.log('Example app listening at http://%s:%s', host, port);
});