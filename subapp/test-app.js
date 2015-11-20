/**
 * Created by v545192 on 11/9/2015.
 */
var express = require('express');
var sqlite3 = require('sqlite3');
var path = require('path')
var orm = require('orm');
var app = express();


app.set('view engine', 'jade');
var bodyParser = require('body-parser');
//app.use(bodyParser.json({ type: 'application/*+json' }));
app.use(bodyParser.json());

app.use(orm.express('sqlite://c:\\Users\\v545192\\Desktop\\Workspace\\WebStorm\\myapp2\\bin\\app.sqlite', {
    define: function(db, models, next){
        models.test_root = db.define("TEST_ROOT", {
            test_root_id      :   {type: 'number', key: true},
            label   :   {type:'text'},
            path :   {type:'text'}
        }, {
            validations: {
                label : [
                    orm.enforce.notEmptyString("Not emptystring"),
                    orm.enforce.unique("Already exists")
                ],
                path : [
                    orm.enforce.notEmptyString("Not emptystring"),
                    orm.enforce.unique("Already exists")
                ]
            }
        });

        next();
    }
}));

var test_route = require('./../routes/route-test');
app.use(test_route);

module.exports = app;