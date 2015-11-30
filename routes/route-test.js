/**
 * Created by v545192 on 11/18/2015.
 */
var tree_util = require('../util/util-tree');
var path = require('path');
var config = require('../config');
var orm = require('orm');

var express = require('express');
var router = express.Router();

router.post('/find_all_test_items', function (req, res) {

    req.models.test_item.find({cmd: orm.like(config.root + '%')}, function (err, test_item_list) {
        if (err) {
            res.status(202).send(err.message);
        }
        else {
            //var formated_tree = tree_util.computeTreeStruct(config.label, config.root, test_item_list);
            test_item_list.forEach(function (test_item) {
                test_item.label = path.join(config.label, path.relative(config.root, path.dirname(test_item.cmd)));
            });
            res.status(200).send({sep: path.sep, list: test_item_list});
        }

    });
});

router.post('/run_test_item_by_cmd', function (req, res) {
    var cmd = req.body.cmd;
    var body = [];
    cmd = path.join(config.root, path.relative(config.label, cmd));
    req.models.test_item.find({cmd: orm.like(cmd + "%")}, function (err, tis) {
        if (err) {
            body.push({success: false, cmd: cmd + "%", msg: err.message});
            res.status(500).send(body);
            return;
        }

        if (!tis || tis.length == 0) {
            body.push({success: false, cmd: cmd + "%", msg: "Not found."});
            res.status(500).send(body);
        }
        else {
            var cnt = tis.length;
            var sendback = function (status) {
                cnt--;
                if (cnt <= 0) {
                    res.status(status).send(body);
                }
            };
            tis.forEach(function (ti) {
                if (ti.running) {
                    body.push(
                        {success: false, test_item_id: ti.test_item_id, cmd: ti.cmd, msg: "Currently running"}
                    );
                    sendback(500);
                }

                req.models.test_run.create([
                    {test_item_id: ti.test_item_id}
                ], function (err, test_runs) {
                    if (err) {
                        body.push(
                            {success: false, test_item_id: ti.test_item_id, msg: err.message}
                        );
                        sendback(500);
                        return;
                    }
                    // Mark test_item to be running
                    ti.running = true;
                    ti.save(function (err) {
                        if (err) throw err;
                    });
                    // Find this newly created test_run record
                    req.models.test_run
                        .find({test_item_id: ti.test_item_id})
                        .order('-test_run_id')
                        .limit(1)
                        .each(function (test_run) {
                            var ti_cmd = ti.cmd;
                            var out_obj = tree_util.computeOutput(ti_cmd);
                            var out_file = out_obj.stdout;
                            var err_file = out_obj.stderr;
                            try {
                                tree_util.createOutputFile(out_file, function (log, logfd) {
                                    tree_util.createOutputFile(err_file, function (errlog, errlogfd) {
                                        var err_cb = require('../util/cb-builder').build_error_cb(ti, test_run, errlog, errlogfd);
                                        var close_cb = require('../util/cb-builder').build_close_cb(ti, test_run, log, logfd, errlog, errlogfd);
                                        var stdout_cb = require('../util/cb-builder').build_stdout_cb(log);
                                        var stderr_cb = require('../util/cb-builder').build_stderr_cb(errlog);
                                        /*
                                         * Spawn command
                                         */
                                        var status = 200;
                                        try {
                                            tree_util.spawnCommand(ti_cmd, stdout_cb, stderr_cb, err_cb, close_cb);
                                            body.push({success: true, cmd: ti_cmd, msg: "Kicking off"});
                                        } catch (e) {
                                            ti.running = false;
                                            ti.save(function (err) {
                                                if (err) throw err;
                                            });
                                            status = 500;
                                            body.push({success: false, cmd: ti_cmd, msg: e.message});
                                        } finally {
                                            sendback(status);
                                            return;
                                        }
                                    });
                                });
                            } catch (e) {
                                body.push({success: false, cmd: ti_cmd, msg: e.message});
                                sendback(500);
                                return;
                            }

                        });

                });
            });

        }
    });
});

router.post('/output_files', function (req, res) {
    var cmd = req.body.cmd;
    tree_util.outputFiles(cmd, function (files) {
        console.log(files);
        res.send(files);
    });

});

router.post('/file_content', function (req, res) {
    var file = req.body.file;
    require('fs').readFile(file, function (err, data) {
        if (err) throw err;
        res.send({content: data.toString()});
    });

});

module.exports = router;