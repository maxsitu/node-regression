/**
 * Created by v545192 on 11/18/2015.
 */
var tree_util = require('../util/util-tree');
var path = require('path');
var config = require('../config');
var orm = require('orm');

var dateformat = require('dateformat');
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/path', function (req, res) {
    res.status(200).send('Hello from A!');
});
router.post('/path', function (req, res) {
    //var p = res.query.path;

    //console.log(JSON.stringify(req.query));
    res.status(200).send('Hello from B!');
});

router.post('/test_tree', function (req, res) {

    var script_root = path.normalize(__dirname + "/../test_cases");
    var tree = tree_util.getTestTree(script_root);

    res.send(JSON.stringify(tree));
});

router.post('/find_all_test_root', function (req, res) {

    req.models.test_item.find({}, function (err, test_item_list) {
        if (err) {
            res.status(202).send(err.message);
        }
        else {
            console.log("ROOT : ", config.root);
            console.log("LABEL: ", config.label);
            var formated_tree = tree_util.computeTreeStruct(config.label, config.root, test_item_list);
            res.status(200).send(formated_tree);
        }

    });
});

router.post('/run_test_item_by_cmd', function (req, res) {
    var cmd = req.body.cmd;
    var body = [];
    req.models.test_item.find({cmd: orm.like(cmd + "%")}, function (err, tis) {
        if (err) {
            body.push({success: false, cmd: cmd + "%", msg: err.message});
            res.status(500).send(body);
            return;
        }

        if (!tis || tis.length == 0) {
            res.status(500).send({success: false, cmd: cmd + "%", msg: "Not found."});
        }
        else {
            var cnt = tis.length;
            var sendback = function (status) {
                cnt--;
                if (cnt <= 0)
                    res.status(status).send(body);
            };
            tis.forEach(function (ti) {
                if (ti.running) {
                    body.push({success: false, test_item_id: ti.test_item_id, cmd: ti.cmd, msg: "Currently running"});
                    sendback(500);
                    return;
                }

                req.models.test_run.create([
                    {test_item_id: ti.test_item_id}
                ], function (err, test_runs) {
                    if (err) {
                        body.push({success: false, test_item_id: ti.test_item_id, msg: err.message});
                        sendback(500);
                        return;
                    }
                    /*
                     * Mark test_item to be running
                     */
                    ti.running = true;
                    ti.save(function (err) {
                        if (err) throw err;
                    });
                    /*
                     * Find this newly created test_run record
                     */
                    req.models.test_run
                        .find({test_item_id: ti.test_item_id})
                        .order('-test_run_id')
                        .limit(1)
                        .each(function (test_run) {
                            var ti_cmd = ti.cmd;
                            var err_cb = function (err) {
                                var time_str = dateformat(new Date(), "yyyy-mm-dd h:MM:ss");
                                ti.running = false;
                                test_run.rc = err.code;
                                test_run.end_time = new Date();
                                ti.save(function (err) {
                                    if (err) throw err;
                                });
                                test_run.save(function (err) {
                                    if (err) throw err;
                                });
                            };
                            var close_cb = function (code) {
                                ti.running = false;
                                test_run.rc = code;
                                test_run.end_time = new Date();

                                ti.save(function (err) {
                                    if (err) throw err;
                                });

                                test_run.save(function (err) {
                                    if (err) throw err;
                                });
                            };
                            /*
                             * Spawn command
                             */
                            tree_util.spawnCommand(ti_cmd, err_cb, close_cb);
                            body.push({success: true, cmd: ti_cmd, msg: "Kicking off"});
                            sendback(500);
                        });

                });
            });

        }
    });
});


module.exports = router;