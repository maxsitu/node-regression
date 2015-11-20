/**
 * Created by v545192 on 11/18/2015.
 */
var test_tree = require('../util/util-tree');
var path = require('path');
var express = require('express');
var router = express.Router();

var tree = null;
/* GET home page. */
router.get('/path', function (req, res) {
    res.status(200).send('Hello from A!');
});
router.post('/path', function (req, res) {
    //var p = res.query.path;

    //console.log(JSON.stringify(req.query));
    res.status(200).send('Hello from B!');
});

router.post('/test_tree', function(req, res){
    if(!tree){
        var script_root = path.join(path.normalize(__dirname + "/../test_cases"));
        tree = test_tree.getTestTree(script_root);
    }
    res.send(JSON.stringify(tree));
});

router.post('/save_test_root', function(req, res){
    var label = req.body.label;
    var path  = req.body.path;
    var msg = '';
    if(!label){
        msg = "label invalid";
    }
    else if(!path){
        msg = "path invalid";
    }

    if(msg){
        res.status(202).send(msg);
    }
    else{
        req.models.test_root.create({label: label, path: path}, function(err){
            if(err){
                res.status(202).send(err.message);
            }
            else{
                req.models.test_root.one({label: label, path: path}, function(err, root){
                    res.status(200).send(root);
                });
            }
        });
    }

});

router.post('/find_all_test_root', function(req, res){

    req.models.test_root.find({}, function(err, root_list){
        if(err){
            res.status(202).send(err.message);
        }
        else{
            res.status(200).send(JSON.stringify(root_list));
        }

    });

});



module.exports = router;