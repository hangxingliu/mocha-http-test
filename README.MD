# MOCHA HTTP TEST
> a tiny http test library based on **mocha** and **request**

[![Build Status](https://travis-ci.org/hangxingliu/mocha-http-test.svg?branch=master)](https://travis-ci.org/hangxingliu/mocha-http-test)

## Version

### 0.0.2

- add http test placeholder method( you can use it when you want to write a test based on other http test output)

### 0.0.1

## Usage

0. require mocha http test module: `HTTPTest = require('mocha-http-test')`
1. create a mocha http test instance: `var http = new HTTPTest()`
2. ... details in file [mocha-http-test.js](mocha-http-test.js)
3. wait for write usage step in here.

put the `http.test..` code inside `describe` function but not `it` function

## API

- `#setBaseUrl(baseUrl)`

- `addChecker(name, checkerFunction, isDefault)`
- `addHeaderSet(name, headerMapObject, isDefault)`
- `packMutlipartBody(mapObject)`

- `#test(testName, methodURI, checker)`
- `#test(testName, methodURI, header, body, checker)`

- `#createTestPlaceholder(testName): placeholderId`
- `#createTestPlaceholder(testName, methodURI): placeholderId`
- `#createTestPlaceholder(testName, methodURI, checker): placeholderId`
- `#createTestPlaceholder(testName, methodURI, header, body, checker): placeholderId`

- `#solveTestPlaceholder(placeholderId, methodURI, checker)`
- `#solveTestPlaceholder(placeholderId, methodURI, header, body, checker)`

## Some Type and Variable you will have doubts

### methodURI

This is a type of string could express HTTP Request method and Request URI
example:
``` javascript
var methodURI1 = 'GET /homepage',
	methodURI2 = 'POST /upload/excel';
```

### body

HTTP Request body content, In Mocha http test module, You can use these three way to express request body:

1. `string` string content body
2. `object` **application/x-www-form-urlencoded** content body
3. `object instanceof http.MultipartBody` **multipart/form-data** content body(you can packup a map object by method `#packMutlipartBody`)

### checkerFunction

``` javascript
	function(err, res, body) {
		//When this response is bad
		return {error: 'Error Message'};
		return true; //When this response is good
	}
```

### checker


1. `'CHECKER_NAME1|CHECKER_NAME2|....'`
2. `CHECKER_FUNCTION`
3. `['CHECKER_NAME1', CHECKER_FUNCTION1, ...]`

### header

1. `'HEADER_NAME1|HEADER_NAME2|....'`
2. `HEADER_MAP_OBJECT`
3. `['HEADER_NAME1', HEADER_MAP_OBJECT1, ...]`



## Author

LiuYue
