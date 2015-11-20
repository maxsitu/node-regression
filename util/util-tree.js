#!'/cygdrive/c/Program Files/nodejs/node'
var fs = require('fs');
var path = require('path');

function getTestTree(loc){
    files = fs.readdirSync(loc);
    var children = [];
    var res = null;
    files.forEach(function(value) {
            var p = path.join(loc, value);
            var lstat = fs.lstatSync(p);
            if(value.match("^test\\..?.?$") && !lstat.isDirectory()){
                if(!res){
                    res = {label:path.basename(loc), scripts: [p]};
                }
                else{
                    res['scripts'].push(p);
                }
            }
            else if(lstat.isDirectory()){
                var kid = getTestTree(p);
                if(kid){
                    children.push(kid);
                }
            }
    });
    if(children.length>0){
        if(!res){
            res = {label: path.basename(loc)};
        }
        res["children"] = children;
    }
    return res;
}

module.exports.getTestTree = getTestTree;
