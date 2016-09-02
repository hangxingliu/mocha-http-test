var Http = require('../mocha-http-test');

var Assert = require('assert'),
	HttpServer = require('http');

var testHost = '127.0.0.1',
	testPort = 8345,
	testServer,
	http;	


before(() => {
	createLocalTestServer();
	http = new Http();
});

describe('MochaHttpTest', () => {

	describe('reflection method', () => {
		it('#testReflectionForDebug', () => {
			Assert.deepEqual(http.reflection('headers'), {}, 'Reflection method is bad!');
		});
	});

	describe('private method', () => {
		it('#analyzeMethodURL2RequestObj', () => {
			var func = http.reflection('analyzeMethodURL2RequestObj');
			Assert.deepEqual(func('errorurl'), null, '#analyzeMethodURL2RequestObj could not ignore wrong method uri string!');
			Assert.deepEqual(func('GETT errorurl'), null, '#analyzeMethodURL2RequestObj could not ignore wrong http request method!');
			Assert.deepEqual(func('GET /'), { method: 'GET', uri: '/', baseUrl: undefined }, '#analyzeMethodURL2RequestObj could not analyze method uri string!');
		});

		it('#analyzeMultiPartParam', () => {
			var func = http.reflection('analyzeMultiPartParam');
			var testSrc = {
				'src1': 'hello',
				'src2': 'world'
			};
			var testFunc = function () { }
			var errorTip = '#analyzeMultiPartParam analyze error!';
			Assert.deepEqual(func('', testSrc), [], errorTip);
			Assert.deepEqual(func('mike', testSrc), [undefined], errorTip);
			Assert.deepEqual(func('src1|mike', testSrc), ['hello', undefined], errorTip);
			Assert.deepEqual(func('src1|src2', testSrc), ['hello', 'world'], errorTip);
			Assert.deepEqual(func('src1', testSrc), ['hello'], errorTip);
			Assert.deepEqual(func(['src1', testFunc], testSrc), ['hello', testFunc], errorTip);
			Assert.deepEqual(func(testFunc, testSrc), [testFunc], errorTip);
		});
	});
	

	describe('public method', ()=>{	
		
		it('#setBaseUrl()', () => {
			var baseUrl = 'http://' + testHost + ':' + testPort;
			http.setBaseUrl(baseUrl);
			Assert.deepEqual(http.reflection('baseUrl'), baseUrl, '#setBaseUrl method could set baseUrl inside httpTest class!');
		});
		
		it('#packMutlipartBody', () => {
			var testContent = { filename: 'test.js', content: 'helloworld!' },
				packageObj = http.packMutlipartBody(testContent);
			Assert(packageObj instanceof http.reflection('MultipartBodyPackage'), '#packMutlipartBody method could not return a MultipartBodyPackage object!')
			Assert.deepEqual(packageObj.get(), testContent, '#packMutlipartBody method could not return a object to pack up another object!');
		});

		it('#addHeaderSet', () => {
			var cookiesHead = { 'Cookie': 'hello=world;blue=sky' },
				jsonHead = { 'Content-Type': 'application/json' },
				uaHead = { 'User-Agent': 'Mocha Test' },
				mixUAJSONHead = { 'Content-Type': jsonHead['Content-Type'], 'User-Agent': uaHead['User-Agent'] };
			
			http.addHeaderSet('cookies', cookiesHead);
			Assert.deepEqual(http.reflection('headers.cookies'), cookiesHead, '#addHeaderSet method could not storage head set inside httpTest class!');
			
			http.addHeaderSet('json', jsonHead, true);
			Assert.deepEqual(http.reflection('headers.json'), jsonHead, '#addHeaderSet method could not storage head set inside httpTest class!(second time to add headset)');
			Assert.deepEqual(http.reflection('defaultHeaders'), jsonHead, '#addHeaderSet method could not storage default head set inside httpTest class!');
			
			http.addHeaderSet('ua', uaHead, true);
			Assert.deepEqual(http.reflection('defaultHeaders'), mixUAJSONHead, '#addHeaderSet method could not storage default head more than one!');
			
		});

		it('#addChecker', () => {
			var connectChecker = (err, res, bd) => {
				if (res.statusCode == 200) return true;
				return { error: 'HTTP Request status code is not 200!' };
			}, isThisTestServerChecker = (err, res, bd) => {
				return res.headers['x-test'] == 'test' ? true : { error: 'HTTP response is not from this test script(because the response has not X-test header or it is not equal "test")!' };
			}, hasMessageFieldChecker = (err, res, bd) => {
				var obj;
				try { obj = JSON.parse(bd); } catch (e) { return { message: 'HTTP response body is not a legal JSON string!' } }
				return obj.message ? true : { error: 'Message field is not inside HTTP response object!' }
			}, isJSONResponseChecker = (err, res, bd) => {
				return res.headers['content-type'] == 'application/json' ? true : { error: 'HTTP response is not JSON content type!' };
			};
			
			http.addChecker('message', hasMessageFieldChecker);
			Assert.equal(http.reflection('checkers.message'), hasMessageFieldChecker, '#addChecker method could not storage checker function inside httpTest class!');
			http.addChecker('json', isJSONResponseChecker);
			Assert.equal(http.reflection('checkers.json'), isJSONResponseChecker, '#addChecker method could not storage checker function inside httpTest class!(second time to add checker)');
			
			http.addChecker('200', connectChecker, true);
			Assert.deepEqual(http.reflection('defaultCheckers[0]'), connectChecker, '#addChecker method could not storage default checker function inside httpTest class!');
			
			http.addChecker('whoami', isThisTestServerChecker, true);
			Assert.deepEqual(http.reflection('defaultCheckers[1]'), isThisTestServerChecker, '#addChecker method could not storage default head more than one!');
			
		});
		
	});
	
	after(() => {
		describe('#test', () => {
			http.test('Request Test: normal', 'GET /');
			http.test('Request Test: json', 'GET /json', '', void 0 ,'json');
			http.test('Request Test: message', 'GET /json/message', '', void 0, 'json|message');
			http.test('Request Test: UserAgent', 'GET /ua', 'ua', void 0, '');
			http.test('Request Test: POST data', 'POST /upload', 'ua', {filename: 'helloworld'}, '');
		});

		describe.skip('#test(error request)', () => {
			//TODO write wrong request unit test(I dont have any good idea to write it)
			http.test('Request Test: json', 'GET /', '', void 0 ,'json');
			http.test('Request Test: message', 'GET /json', '', void 0, 'json|message');
			http.test('Request Test: POST data', 'POST /upload', 'ua', {filename: 'error'}, '');
		});
	});	
	
});

after(() => {
	destoryLocalTestServer();
});

function createLocalTestServer() {
	var extend = require('../lib/extend')
	var head = { 'x-test': 'test' };
	testServer = HttpServer.createServer((req, res) => {
		var newHead = extend(true, {}, head);
		var statusCode = 200;
		var body = '';
		if (req.url.startsWith('/json') )
			newHead['content-type'] = 'application/json';
		if (req.url == '/json/message')
			body = '{"message": "test"}';
		if (req.url == '/ua')
			if (req.headers['user-agent'] != 'Mocha Test')
				statusCode = 403;
		if (req.method == 'POST')
			return req.on('data', function (data) {
				if (data.toString('utf8') == 'filename=helloworld')
					return res.writeHead(statusCode, newHead), res.write(body), res.end();	
			});
		

		res.writeHead(statusCode,  newHead);
		res.write(body);
		res.end();
	}).listen(testPort);
}
function destoryLocalTestServer() {
	testServer.close();
}