define(['exports', '../globals/globals', 'metal-uri/src/Uri'], function (exports, _globals, _Uri) {
	'use strict';

	Object.defineProperty(exports, "__esModule", {
		value: true
	});

	var _globals2 = _interopRequireDefault(_globals);

	var _Uri2 = _interopRequireDefault(_Uri);

	function _interopRequireDefault(obj) {
		return obj && obj.__esModule ? obj : {
			default: obj
		};
	}

	function _classCallCheck(instance, Constructor) {
		if (!(instance instanceof Constructor)) {
			throw new TypeError("Cannot call a class as a function");
		}
	}

	var _createClass = function () {
		function defineProperties(target, props) {
			for (var i = 0; i < props.length; i++) {
				var descriptor = props[i];
				descriptor.enumerable = descriptor.enumerable || false;
				descriptor.configurable = true;
				if ("value" in descriptor) descriptor.writable = true;
				Object.defineProperty(target, descriptor.key, descriptor);
			}
		}

		return function (Constructor, protoProps, staticProps) {
			if (protoProps) defineProperties(Constructor.prototype, protoProps);
			if (staticProps) defineProperties(Constructor, staticProps);
			return Constructor;
		};
	}();

	var utils = function () {
		function utils() {
			_classCallCheck(this, utils);
		}

		_createClass(utils, null, [{
			key: 'clearNodeAttributes',
			value: function clearNodeAttributes(node) {
				Array.prototype.slice.call(node.attributes).forEach(function (attribute) {
					return node.removeAttribute(attribute.name);
				});
			}
		}, {
			key: 'copyNodeAttributes',
			value: function copyNodeAttributes(source, target) {
				Array.prototype.slice.call(source.attributes).forEach(function (attribute) {
					return target.setAttribute(attribute.name, attribute.value);
				});
			}
		}, {
			key: 'getCurrentBrowserPath',
			value: function getCurrentBrowserPath() {
				return this.getCurrentBrowserPathWithoutHash() + _globals2.default.window.location.hash;
			}
		}, {
			key: 'getCurrentBrowserPathWithoutHash',
			value: function getCurrentBrowserPathWithoutHash() {
				return _globals2.default.window.location.pathname + _globals2.default.window.location.search;
			}
		}, {
			key: 'getUrlPath',
			value: function getUrlPath(url) {
				var uri = new _Uri2.default(url);
				return uri.getPathname() + uri.getSearch() + uri.getHash();
			}
		}, {
			key: 'getUrlPathWithoutHash',
			value: function getUrlPathWithoutHash(url) {
				var uri = new _Uri2.default(url);
				return uri.getPathname() + uri.getSearch();
			}
		}, {
			key: 'getUrlPathWithoutHashAndSearch',
			value: function getUrlPathWithoutHashAndSearch(url) {
				var uri = new _Uri2.default(url);
				return uri.getPathname();
			}
		}, {
			key: 'isCurrentBrowserPath',
			value: function isCurrentBrowserPath(url) {
				if (url) {
					return utils.getUrlPathWithoutHash(url) === this.getCurrentBrowserPathWithoutHash();
				}
				return false;
			}
		}, {
			key: 'isHtml5HistorySupported',
			value: function isHtml5HistorySupported() {
				return !!(_globals2.default.window.history && _globals2.default.window.history.pushState);
			}
		}, {
			key: 'querySelectorAll',
			value: function querySelectorAll(selector) {
				var parent = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _globals2.default.document;

				return Array.prototype.slice.call(parent.querySelectorAll(selector));
			}
		}]);

		return utils;
	}();

	exports.default = utils;
});
//# sourceMappingURL=utils.js.map
