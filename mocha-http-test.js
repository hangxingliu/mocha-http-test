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

	//Array<params: {
	//	methodURL: string(cover), header: any(extend), body: any(cover), checker: any(extend)
	//}>
	var placeholder = [];

	this.createTestPlaceholder = function (testName, methodURL, header, body, checker) {
		if (arguments.length == 3) {
			checker = header;
			header = '';
		}

		var placeholderId = placeholder.push({
			methodURL: methodURL,
			header: header,
			body: body,
			checker: checker
		}) - 1;

		var context = placeholder[placeholderId];
		
		return it(testName, function (done) {
			if (!context.requestOpts)
				return Assert(!1, Message.PLACEHOLDER_ERROR), done();
			request(context.requestOpts, function (err, res, bd) {
				return pipeHTTPResult2Chcker(err, res, bd, context.checker), done();
			});
		}), placeholderId;
	}

	this.solveTestPlaceholder = function (placeholderId, methodURL, header, body, checker) {
		if (arguments.length < 4) {
			checker = header;
			header = '';
		}
		
		var context = placeholder[placeholderId];
		if (!context) return !1;

		var requestHeaders = extend(true, {}, defaultHeaders);
		var requestOpts = analyzeMethodURL2RequestObj(methodURL || context.methodURL);
		//methodURL 出错
		if (!requestOpts)
			return Assert(!1, Message.METHOD_URL_ERROR);

		//处理Header
		var addHeaders1 = context.header ? analyzeMultiPartParam(context.header, headers) : [];
		var addHeaders2 = header ? analyzeMultiPartParam(header, headers) : [];
		extend.apply(null, [true, requestHeaders].concat(addHeaders1).concat(addHeaders2) );

		
		//处理Checker		
		var _checkers1 = context.checker ? analyzeMultiPartParam(context.checker, checkers) : [];
		var _checkers2 = checker ? analyzeMultiPartParam(checker, checkers) : [];
		context.checker = _checkers1.concat(_checkers2);

		//处理BODY
		addBodyParam2RequestObj(body || context.body, requestOpts);

		requestOpts.headers = requestHeaders;

		context.requestOpts = requestOpts;
	}

	this.test = function (testName, methodURL, header, body, checker) {
		if (arguments.length < 5) {
			checker = header;
			header = '';
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
		addBodyParam2RequestObj(body, requestOpts);

		requestOpts.headers = requestHeaders;
		return it(testName, (done) => {
			request(requestOpts, (err, res, bd) => {
				return pipeHTTPResult2Chcker(err, res, bd, requestCheckers), done();
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
	
	function pipeHTTPResult2Chcker(err, res, bd, checkers) {
		if (err)
			return Assert(!1, Message.format(Message.REQUEST_ERROR, err));
		var _checkers = defaultCheckers.concat(checkers),
			checkerReturn;
		for(var i in _checkers) {
			checkerReturn = _checkers[i](err, res, bd);
			if (typeof checkerReturn == 'object')
				return Assert(!1, Message.format(Message.CHECKER_ERROR, checkerReturn.error));
		}
	}

	function addBodyParam2RequestObj(body, requestObj) {
		if (body) {
			if (typeof body == 'string') {
				requestObj.body = body;
			} else if (body instanceof MultipartBodyPackage) {
				requestObj.formDara = body.get();
			} else {
				requestObj.form = body;
			}
		}
	}

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

