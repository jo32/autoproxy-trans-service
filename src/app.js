var express = require('express');
var app = express();
var autoproxy2pac = require('autoproxy2pac');

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
        pac.content = null;
        log(`cleaned cached of precise mode: ${isPrecise}`);
        pac.content = await autoproxy2pac.genPac({
            proxy: '__PROXY__',
            precise: isPrecise
        });
        log(`generated cached of precise mode: ${isPrecise}`);
    }
    updatePac();
    setInterval(updatePac, 1000 * 60 * 60);

    return async function() {
        return pac.content;
    }
}

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
            if (precise) {
                pac = await fastPacGetter();
            } else {
                pac = await precisePacGetter();
            }
            pac = pac.replace('__PROXY__', proxy);
            res.type('application/x-ns-proxy-autoconfig').send(pac);
        } catch (e) {
            return next(e);
        }
    })();
});

app.use(function(err, req, res, next) {
    if (err) {
        log(err);
        res.status(err.status).json({
            status: err.status,
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