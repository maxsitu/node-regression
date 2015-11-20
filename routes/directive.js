/**
 * Created by v545192 on 11/3/2015.
 */
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/:directive', function(req, res, next) {
    res.render("directive/" + req.params.directive);
});

module.exports = router;