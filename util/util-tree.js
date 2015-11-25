#!'/cygdrive/c/Program Files/nodejs/node'
var fs = require('fs');
var path = require('path');

function getTestTree(loc) {
    files = fs.readdirSync(loc);
    var children = [];
    var res = null;
    files.forEach(function (value) {
        var p = path.join(loc, value);
        var lstat = fs.lstatSync(p);
        if (value.match("^test\\..?.?$") && !lstat.isDirectory()) {
            if (!res) {
                res = {label: path.basename(loc), scripts: [p]};
            }
            else {
                res['scripts'].push(p);
            }
        }
        else if (lstat.isDirectory()) {
            var kid = getTestTree(p);
            if (kid) {
                children.push(kid);
            }
        }
    });
    if (children.length > 0) {
        if (!res) {
            res = {label: path.basename(loc)};
        }
        res["children"] = children;
    }
    return res;
}

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

function spawnCommand(cmd, err_cb, close_cb) {
    var spawn = require('child_process').spawn;
    //var proc = spawn(cmd);
    var proc = spawn("echo", [cmd]);

    proc.stdout.on('data', function (data) {
        console.log("STDOUT: ", data.toString());
    });

    proc.stderr.on('date', function (data) {
        console.error("STDERR: ", data.toString());
    });

    proc.on('error', function (err) {
        console.error("ERROR:");
        console.error("code:", err.code);
        console.error("msg :", err.message);

        err_cb(err);
    });

    proc.on('close', function (code) {
        console.log("CLOSE:");
        console.log("code:", code);

        close_cb(code);
    });
}
module.exports = {getTestTree: getTestTree, getAllTestCommand: getAllTestCommand, spawnCommand: spawnCommand, computeTreeStruct: computeTreeStruct};
