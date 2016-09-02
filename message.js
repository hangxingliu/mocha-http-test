var thiz = {
	METHOD_URL_ERROR: '带有HTTP请求方法名和URL的字符串出错!(格式: HTTP请求方法名 URI)',
	REQUEST_ERROR: 'HTTP请求出错, 错误原因: {0}',
	CHECKER_ERROR: 'HTTP请求无法通过验证器, 错误原因:{0}',
	
	format: function(msg, args) {
		var argArr = arguments;
		return msg.replace(/\{(\d+)\}/g, function (_, index) {
			return (argArr[parseInt(index) + 1]).toString();
		});
	}
};

module.exports = thiz;