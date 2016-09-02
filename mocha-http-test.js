/**
 * 版本:
 * 0.0.1
 * 
 * 测试前说明:
 * 1. 请基于mochajs测试
 * 2. 直接放入describe内测试即可
 *
 * 使用方法:
 *
 * httpTest = new HTTPTest();
 * httpTest.baseUrl = 'baseUrl';
 * httpTest.test(TEST_NAME, METHOD_URL, CHECKER)
 * httpTest.test(TEST_NAME, METHOD_URL, HEADER, BODY, CHECKER)
 * httpTest.addChecker('name', function(err, res, body) {
 *		return {error: 'Error Message'};
 * 		return true;//It is ok
 * }, isDefault = false)
 * httpTest.addHeaderSet('name', Object, isDefault = false);
 * httpTest.packMutlipartBody(Object);
 *
 * METHOD_URL: 'METHOD URL';
 * HEADER: 'HEADRER1|HEADER2|...',
 *			[HEADERString/Object, ...],
 *			Object
 * BODY: 	String //As Body String
 *			Object //As application/x-www-form-urlencoded String
 *			Object insteadof httpTest.MultipartBody
 * CHECKER: 'Checker1|Checker2|...'
 *			[CheckerString/CheckerFunction]
 *			CheckerFunction
 * The Varible like CHECKER OR HEADER PARAM BE NAMED "MultiPartParam"
 */

var request = require('request');
var Assert = require('assert');

var extend = require('./lib/extend');
var Message = require('./message');


var httpTest = function(){
	var thiz = this;
	var defaultHeaders = {},
		defaultCheckers = [];
	var headers = {},
		checkers = {},
		baseUrl = void 0;

	this.test = function (testName, methodURL, header, body, checker) {
		if (arguments.length < 5) {
			checker = header;
			header = '';
			body = void 0;
		}
		
		var requestHeaders = extend(true, {}, defaultHeaders);
		var requestOpts = analyzeMethodURL2RequestObj(methodURL);
		//methodURL 出错
		if (!requestOpts) {
			return it(testName, function () {
				Assert(!1, Message.METHOD_URL_ERROR);
			});
		}
		//处理Header
		var addHeaders = analyzeMultiPartParam(header, headers);
		extend.apply(null, [true, requestHeaders].concat(addHeaders) );

		//处理Checker		
		var requestCheckers = checker ? analyzeMultiPartParam(checker, checkers) : [];

		//处理BODY
		if (body) {
			if (typeof body == 'string') {
				requestOpts.body = body;
			} else if (body instanceof MultipartBodyPackage) {
				requestOpts.formDara = body.get();
			} else {
				requestOpts.form = body;
			}
		}

		requestOpts.headers = requestHeaders;
		return it(testName, function (done) {
			request(requestOpts, function (err, res, bd) {
				if (err) {
					Assert(!1, Message.format(Message.REQUEST_ERROR, err));
					return done();
				}
				var _checkers = defaultCheckers.concat(requestCheckers);
				var checkerReturn;
				for(var i in _checkers) {
					checkerReturn = _checkers[i](err, res, bd);
					if (typeof checkerReturn == 'object') {
						return Assert(!1, Message.format(Message.CHECKER_ERROR, checkerReturn.error)),
							done();
					}
				}
				done();
			});
		});
		
	}
	this.addChecker = function(checkerName, callback, isDefault) {
		checkers[checkerName] = callback;
		if (isDefault)
			defaultCheckers.push(callback);	
		return callback;
	}
	this.addHeaderSet = function (headerName, header, isDefault) {
		headers[headerName] = header;
		if(isDefault)
			extend(true, defaultHeaders, header);
		return header;
	}
	this.packMutlipartBody = function(bodyObject) {
		return new MultipartBodyPackage(bodyObject);
	}
	this.setBaseUrl = function (url) { baseUrl = url;}

	this.reflection = function (name) { return eval(name);}
	
	function analyzeMethodURL2RequestObj(methodURL) {
		var parts = methodURL.match(/^(GET|POST|DELETE|PUT|HEAD|OPTION)\s+(.+)$/);
		if (!parts)
			return null;	
		return {
			method: parts[1],
			uri: parts[2],
			baseUrl: baseUrl
		};
	}	
};

function MultipartBodyPackage(obj) {
	this.get = function () { return obj}
}

function analyzeMultiPartParam(input, src) {
	if (typeof input == 'string') {
		input = input.split('|');
		if (input.length == 1 && input[0] == '')
			return [];
	}
	if (!(input instanceof Array))
		input = [input];
	for(var i in input)
		if (typeof input[i] == 'string')
			input[i] = src[input[i]];	
	return input;
}


module.exports = httpTest;

