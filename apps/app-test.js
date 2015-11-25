/**
 * Created by v545192 on 11/9/2015.
 */
var express = require('express');
var sqlite3 = require('sqlite3');
var path = require('path')
var orm = require('orm');

/*
 * Get Subapp Instance
 */
console.log("Initialze test app ...");
var app = express();

/*
 * View Engine
 */
app.set('view engine', 'jade');

/*
 * Body Parser
 */
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }))
//app.use(bodyParser.json({ type: 'application/*+json' }));
app.use(bodyParser.json());

/*
 * ORM Setting
 */
var config = require('../config');
var tree_util = require('../util/util-tree');
var root_label = config.label;
var root_path = config.root;
app.use(orm.express('sqlite://' + path.normalize(__dirname + "/../bin/app.sqlite"), {
    define: function(db, models, next){
        models.test_item = db.define("TEST_ITEM", {
            test_item_id: {type: 'number', key: true},
            cmd: {type: 'text'},
            rc: {type: 'number'},
            running: {type: "boolean"}
        }, {
            validations: {
                cmd: [
                    orm.enforce.notEmptyString("Not emptystring"),
                    orm.enforce.unique("Already exists")
                ]
            }
        });

        models.test_run = db.define("TEST_RUN", {
            test_run_id: {type: 'number', key: true},
            test_item_id: {type: 'number'},
            rc: {type: 'number'},
            start_time: {type: 'date', time: true},
            end_time: {type: 'date', time: true},
            modify_time: {type: 'date', time: true}
        }, {
            methods: {
                logInfo: function () {
                    console.log(this.test_run_id);
                    console.log(this.test_item_id);
                    console.log(this.start_time);
                    console.log(this.end_time);
                    console.log(this.modify_time);
                }
            }
        });

//        models.test_run.hasOne('test_item', models.test_item, {field: "test_item_id", reverse: 'test_runs', autoFetch: true});

        db.sync(function (err) {
            if (err) throw err;
            var test_cases = tree_util.getAllTestCommand(root_path);
            test_cases.forEach(function (cmd) {
                models.test_item.exists({cmd: cmd}, function (err, exists) {
                    if (err) throw err;
                    if (!exists) {
                        models.test_item.create({cmd: cmd}, function (err) {
                            if (err) throw err;
                        });
                    }
                })
            });
        });
        next();
    }
}));

/*
 * Use route for test app
 */
var test_route = require('./../routes/route-test');
app.use(test_route);

module.exports = app;