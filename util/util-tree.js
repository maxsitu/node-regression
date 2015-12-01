#!'/cygdrive/c/Program Files/nodejs/node'
var fs = require('fs');
var path = require('path');
var dateformat = require('dateformat');
var config = require('../config');
var mkdirp = require('mkdirp');
var dir = require('node-dir');

function getAllTestCommand(loc) {
    files = fs.readdirSync(loc);
    var res = [];
    files.forEach(function (value) {
        var p = path.join(loc, value);
        var lstat = fs.lstatSync(p);
        if (value.match("^test\\..?.?$") && !lstat.isDirectory()) {
            res.push(p);
        }
        else if (lstat.isDirectory()) {
            Array.prototype.push.apply(res, getAllTestCommand(p));
        }
    });
    return res;
}

function computeTreeStruct(label, root, test_item_list) {
    var res = {};
    var compute = function (label_arr, n_path, test_item, map, par) {
        if (label_arr.length == 1) {
            var label = label_arr[0];
            test_item.label = label;
            if (!map[label]) {
                map[label] = test_item;
            }
            if (!par.children) {
                par.children = [];
            }
            par.children.push(test_item);
        }
        else {
            label = label_arr.shift();
            if (!map[label]) {
                map[label] = {};
            }
            if (!par.children) {
                par.children = [];
            }
            var item = {label: label, path: path.join(n_path, label)};
            par.children.push(item);
            compute(label_arr, path.join(n_path, label), test_item, map[label], item);
        }
    };
    var map = {};
    test_item_list.forEach(function (test_item) {
        var cmd = test_item.cmd;
        var rel_path = path.relative(root, path.dirname(cmd));
        var label_path = rel_path.split(path.sep);
        if (label_path.length == 0) {
            test_item.childrean = res.children;
            res = test_item;
        } else {
            compute(label_path, root, test_item, map, res);
        }
    });
    res.label = label;
    res.path = root;

    return res;
}

function spawnCommand(cmd, stdout_cb, stderr_cb, err_cb, close_cb) {
    var spawn = require('child_process').spawn;
    var proc = spawn(cmd);
    //var proc = spawn("echo", [cmd]);

    proc.stdout.on('data', function (data) {
        stdout_cb(data);
    });

    proc.stderr.on('data', function (data) {
        stderr_cb(data);
    });

    proc.on('error', function (err) {
        err_cb(err);
    });

    proc.on('close', function (code) {
        close_cb(code);
    });
}

function computeOutputDir(test_dir) {
    return path.join(config.output, path.relative(config.root, test_dir));
}

function computeOutput(cmd) {
    var out_dir = computeOutputDir(path.dirname(cmd));
    var timestamp_str = dateformat(new Date(), "yyyymmdd_HH-MM-ss-l");
    var log_file = path.join(out_dir, 'test-' + timestamp_str + ".log");
    var err_file = path.join(out_dir, 'test-' + timestamp_str + ".log.err");
    return {stdout: log_file,
        stderr: err_file
    };
}

function createOutputFile(file, cb) {
    mkdirp(path.dirname(file), function (err, made) {
        if (err)
            throw err;
        fs.open(file, 'a', function (err, fd) {
            if (err)
                throw err;
            cb(file, fd);
        });
    });
}

function outputFiles(cmd, cb) {
    var out_dir = computeOutputDir(path.dirname(cmd));
    dir.files(out_dir, function (err, files) {
        if (err) {
            cb([]);
            return;
        }
        files = files.filter(function (file) {
            basename = path.basename(file);
            var res = basename.match(/^test-\d\d\d\d\d\d\d\d_\d\d-\d\d-\d\d-\d\d\d\.log(?:\.err)?$/);
            return (res && res.length > 0);
        });
        files.sort();
        files.reverse();
        cb(files);
    });
}

module.exports = {
    getAllTestCommand: getAllTestCommand,
    spawnCommand: spawnCommand,
    computeTreeStruct: computeTreeStruct,
    computeOutput: computeOutput,
    createOutputFile: createOutputFile,
    outputFiles: outputFiles
};
