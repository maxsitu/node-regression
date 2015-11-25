var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var index = require('./../routes/route-index');
var directive = require('./../routes/directive');

/*
 * Express Instance
 */
console.log("Initialize index app ...");
var app = express();

/*
 * View Engine
 */
app.set('views', path.join(path.normalize(__dirname + "/.."), 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
/*
 * Body Parser
 */
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

/*
 * Cookie Parser
 */
app.use(cookieParser());

/*
 * Set Public folder and module folder
 */
app.use(express.static(path.join(path.normalize(__dirname + "/.."), 'public')));
app.use('/modules', express.static(path.join(path.normalize(__dirname + "/.."), 'node_modules')));
app.use('/directive', directive);
app.use('/', index);


// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
