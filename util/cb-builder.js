/**
 * Created by v545192 on 11/25/2015.
 */

var config = require('../config');

function build_error_cb(test_item, test_run, errlog, errlogfd) {
    return function (err) {

        require('fs').appendFile(errlog, err.message, function (err) {
            if (err) {
                console.error("ERROR appending to file: ");
                console.error("code:", err.code);
                console.error("msg :", err.message);
            }
        });

        test_item.running = false;
        test_item.save(function (err) {
            if (err) throw err;
        });

        test_run.rc = err.code;
        test_run.end_time = new Date();
        test_run.save(function (save_err) {
            if (save_err) throw save_err;
            config.wss.broadcast('refresh on error');
        });
    };
}

function build_close_cb(test_item, test_run, log, logfd, errlog, errlogfd) {
    return function (code) {
        console.log("RC:", code);
        test_item.running = false;
        test_item.save(function (err) {
            if (err) throw err;
        });

        test_run.rc = code;
        test_run.end_time = new Date();

        test_run.save(function (save_err) {
            if (save_err) throw save_err;
            config.wss.broadcast('refresh on close');
        });

        require('fs').appendFile(log, "\nRC = " + code, function (err) {
            if (err) {
                console.error("ERROR appending to file: ");
                console.error("code:", err.code);
                console.error("msg :", err.message);
            }
            require('fs').close(logfd, function (err) {
                if (err)
                    console.error(err.message);
            });
        });


        require('fs').close(errlogfd, function (err) {
            if (err)
                console.error(err.message);
        });
    };
}

function build_stdout_cb(log) {
    return function (data) {
        require('fs').appendFile(log, data.toString(), function (err) {
            console.log("STDOUT: ", data.toString());
            if (err)
                console.error(err.message);

        });
    };
}

function build_stderr_cb(errlog) {
    return function (data) {
        require('fs').appendFile(errlog, data.toString(), function (err) {
            console.error("STDERR: ", data.toString());
            if (err)
                console.error(err.message);
        });
    };
}

module.exports = {
    build_error_cb: build_error_cb,
    build_close_cb: build_close_cb,
    build_stdout_cb: build_stdout_cb,
    build_stderr_cb: build_stderr_cb
};