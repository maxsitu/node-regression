var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Regression Tester', ngAppName: 'testerApp' });
});

router.get('/nodes', function(req, res) {
    res.send([
        {'label': 'securityservice',
            'isRunning': true,
            'children': [
                {   'label': 'secs2-secsj',
                    'isRunning': true,
                    'children': [
                        {
                            'label': 'dev',
                            'isRunning': false,
                            'rc': 0,
                            'command': '/bin/echo dev'
                        },
                        {
                            'label': 'qa',
                            'isRunning': true,
                            'rc': 1,
                            'command': '/bin/echo qa'
                        }
                    ]
                },
                {   'label': 'secs2cache-secsj',
                    'isRunning': false,
                    'children': [
                        {
                            'label': 'dev',
                            'isRunning': false,
                            'command': '/bin/echo dev'
                        },
                        {
                            'label': 'qa',
                            'isRunning': false,
                            'command': '/bin/echo qa'
                        }
                    ]
                }
            ]
        },
        {'label': 'securityservice',
            'isRunning': true,
            'children': [
                {   'label': 'secs2-secsj',
                    'isRunning': true,
                    'children': [
                        {
                            'label': 'dev',
                            'isRunning': false,
                            'rc': 0,
                            'command': '/bin/echo dev'
                        },
                        {
                            'label': 'qa',
                            'isRunning': true,
                            'rc': 1,
                            'command': '/bin/echo qa'
                        }
                    ]
                },
                {   'label': 'secs2cache-secsj',
                    'isRunning': false,
                    'children': [
                        {
                            'label': 'dev',
                            'isRunning': false,
                            'command': '/bin/echo dev'
                        },
                        {
                            'label': 'qa',
                            'isRunning': false,
                            'command': '/bin/echo qa'
                        },
                        {'label': 'securityservice',
                            'isRunning': true,
                            'children': [
                                {   'label': 'secs2-secsj',
                                    'isRunning': true,
                                    'children': [
                                        {
                                            'label': 'dev',
                                            'isRunning': false,
                                            'rc': 0,
                                            'command': '/bin/echo dev'
                                        },
                                        {
                                            'label': 'qa',
                                            'isRunning': true,
                                            'rc': 1,
                                            'command': '/bin/echo qa'
                                        }
                                    ]
                                },
                                {   'label': 'secs2cache-secsj',
                                    'isRunning': false,
                                    'children': [
                                        {
                                            'label': 'dev',
                                            'isRunning': false,
                                            'command': '/bin/echo dev'
                                        },
                                        {
                                            'label': 'qa',
                                            'isRunning': false,
                                            'command': '/bin/echo qa'
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    ]);
});


router.post('/run',function(req, res, next ){
   console.log(req.body.node);
});

module.exports = router;
