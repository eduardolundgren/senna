'use strict';

import errors from '../../src/errors/errors';
import globals from '../../src/globals/globals';
import RequestScreen from '../../src/screen/RequestScreen';
import UA from 'metal-useragent';

describe('RequestScreen', function() {

	let fetchStub;

	beforeEach(() => {
		UA.testUserAgent(UA.getNativeUserAgent(), UA.getNativePlatform());

		// A fix for window.location.origin in Internet Explorer
		if (!globals.window.location.origin) {
			globals.window.location.origin = globals.window.location.protocol + '//' + globals.window.location.hostname + (globals.window.location.port ? ':' + globals.window.location.port : '');
		}

		fetchStub = sinon.stub(window, 'fetch');
	});

	afterEach(() => {
		fetchStub.restore();
	});

	it('should be cacheable', () => {
		var screen = new RequestScreen();
		assert.ok(screen.isCacheable());
	});

	it('should set HTTP method', () => {
		var screen = new RequestScreen();
		assert.strictEqual(RequestScreen.GET, screen.getHttpMethod());
		screen.setHttpMethod(RequestScreen.POST);
		assert.strictEqual(RequestScreen.POST, screen.getHttpMethod());
	});

	it('should set HTTP headers', () => {
		var screen = new RequestScreen();
		assert.deepEqual({
			'X-PJAX': 'true',
			'X-Requested-With': 'XMLHttpRequest'
		}, screen.getHttpHeaders());
		screen.setHttpHeaders({});
		assert.deepEqual({}, screen.getHttpHeaders());
	});

	it('should set timeout', () => {
		var screen = new RequestScreen();
		assert.strictEqual(30000, screen.getTimeout());
		screen.setTimeout(0);
		assert.strictEqual(0, screen.getTimeout());
	});

	it('should screen beforeUpdateHistoryPath return request path if responseURL or X-Request-URL not present', () => {
		var screen = new RequestScreen();
		sinon.stub(screen, 'getRequest', () => {
			return {
				headers: {
					get() {
						return null;
					}
				},
				url: '/path'
			};
		});
		assert.strictEqual('/path', screen.beforeUpdateHistoryPath('/path'));
	});

	it('should screen beforeUpdateHistoryPath return responseURL if present', () => {
		var screen = new RequestScreen();
		sinon.stub(screen, 'getRequest', () => {
			return {
				headers: {
					get() {
						return '/redirect';
					}
				},
				url: '/path'
			};
		});
		assert.strictEqual('/redirect', screen.beforeUpdateHistoryPath('/path'));
	});

	it('should screen beforeUpdateHistoryPath return X-Request-URL if present and responseURL is not', () => {
		var screen = new RequestScreen();
		sinon.stub(screen, 'getRequest', () => {
			return {
				headers: {
					get() {
						return '/redirect';
					}
				}
			};
		});
		assert.strictEqual('/redirect', screen.beforeUpdateHistoryPath('/path'));
	});

	it('should screen beforeUpdateHistoryState return null if form navigate to post-without-redirect-get', () => {
		var screen = new RequestScreen();
		assert.strictEqual(null, screen.beforeUpdateHistoryState({
			senna: true,
			form: true,
			redirectPath: '/post',
			path: '/post'
		}));
	});

	it('should request path return null if no requests were made', () => {
		var screen = new RequestScreen();
		assert.strictEqual(null, screen.getRequestPath());
	});

	it('should send request to an url', (done) => {
		// This test will run only on Chrome to avoid unique url on test case
		if (!UA.isChrome) {
			done();
		} else {
			fetchStub.returns(Promise.resolve(
				new Response('', {status: 200})
			));

			var screen = new RequestScreen();
			screen.load('/url').then(() => {
				assert.strictEqual(globals.window.location.origin + '/url', screen.getRequest().url);

				const request = screen.getRequest();
				assert.deepEqual(request.headers.get('X-PJAX'), 'true');
				assert.deepEqual(request.headers.get('X-Requested-With'), 'XMLHttpRequest');

				done();
			});
		}
	});

	it('should load response content from cache', (done) => {
		fetchStub.returns(Promise.resolve(
			new Response('', {status: 200})
		));

		var screen = new RequestScreen();
		var cache = {};
		screen.addCache(cache);
		screen.load('/url').then((cachedContent) => {
			assert.strictEqual(cache, cachedContent);
			done();
		});
	});

	it('should not load response content from cache for post requests', (done) => {
		fetchStub.returns(Promise.resolve(
			new Response('stuff', {status: 200})
		));

		var screen = new RequestScreen();
		var cache = {};
		screen.setHttpMethod(RequestScreen.POST);
		screen.load('/url').then(() => {
			fetchStub.reset();
			fetchStub.returns(Promise.resolve(
				new Response('stuff', {status: 200})
			));

			screen.load('/url').then(cachedContent => {
				assert.notStrictEqual(cache, cachedContent);
				done();
			});
		});
	});

	xit('should fail for timeout request', (done) => {
		let id;
		fetchStub.returns(new Promise((resolve) => {
			setTimeout(() => {
				resolve(new Response('', {status: 200}));
			}, 100);
		}));

		var screen = new RequestScreen();
		screen.setTimeout(0);
		screen.load('/url')
			.catch((reason) => {
				assert.ok(reason.timeout);
				clearTimeout(id);
				done();
			});
	});

	it('should fail for invalid status code response', (done) => {
		fetchStub.returns(Promise.resolve(
			new Response('', {status: 404})
		));

		new RequestScreen()
			.load('/url')
			.catch((error) => {
				assert.ok(error.invalidStatus);
				done();
			});
	});

	it('should return the correct http status code for "page not found"', (done) => {
		fetchStub.returns(Promise.resolve(
			new Response('', {status: 404})
		));

		new RequestScreen()
			.load('/url')
			.catch((error) => {
				assert.strictEqual(error.statusCode, 404);
				done();
			});
	});

	it('should return the correct http status code for "unauthorised"', (done) => {
		fetchStub.returns(Promise.resolve(
			new Response('', {status: 401})
		));

		new RequestScreen()
			.load('/url')
			.catch((error) => {
				assert.strictEqual(error.statusCode, 401);
				done();
			});
	});

	it('should fail for request errors response', (done) => {
		fetchStub.returns(Promise.reject(
			new Error(errors.REQUEST_ERROR)));

		new RequestScreen()
			.load('/url')
			.catch((error) => {
				assert.ok(error.requestError);
				done();
			});
	});

	it('should form navigate force post method and request body wrapped in FormData', (done) => {
		globals.capturedFormElement = globals.document.createElement('form');

		let formData = new FormData(globals.capturedFormElement);

		fetchStub.returns(Promise.resolve(
			new Response('', {status: 200})
		));

		var screen = new RequestScreen();
		screen.load('/url').then(() => {
			assert.strictEqual(RequestScreen.POST, screen.getRequest().method.toLowerCase());
			// assert.ok(res instanceof FormData);
			globals.capturedFormElement = null;
			done();
		});
	});

	xit('should add submit input button value into request FormData', (done) => {
		fetchStub.returns(new Promise(resolve => {
			resolve(new Response('', {status: 200}));
		}));

		globals.capturedFormElement = globals.document.createElement('form');
		const submitButton = globals.document.createElement('button');
		submitButton.name = 'submitButton';
		submitButton.type = 'submit';
		submitButton.value = 'Send';
		globals.capturedFormElement.appendChild(submitButton);
		globals.capturedFormButtonElement = submitButton;
		var screen = new RequestScreen();
		var spy = sinon.spy(FormData.prototype, 'append');
		screen.load('/url')
			.then(() => {
				assert.ok(spy.calledWith(submitButton.name, submitButton.value));
				globals.capturedFormElement = null;
				globals.capturedFormButtonElement = null;
				spy.restore();
				done();
			});
	});

	it('should not cache get requests on ie browsers', (done) => {
		// This test will run only on IE
		if (!UA.isIe) {
			done();
		} else {
			fetchStub.returns(Promise.resolve(
				new Response('', {status: 200})
			));

			var url = '/url';
			var screen = new RequestScreen();
			screen.load(url).then(() => {
				assert.notStrictEqual(url, screen.getRequest().url);
				assert.strictEqual(url, screen.getRequestPath());
				done();
			});
		}
	});

	it('should not cache get requests on edge browsers', (done) => {
		// This test will run only on Edge
		if (!UA.isEdge) {
			done();
		} else {
			fetchStub.returns(Promise.resolve(
				new Response('', {status: 200})
			));


			var url = '/url';
			var screen = new RequestScreen();
			screen.load(url).then(() => {
				assert.notStrictEqual(url, screen.getRequest().url);
				done();
			});
		}
	});

	it('should not cache redirected requests on edge browsers', (done) => {
		// This test will run only on Edge
		if (!UA.isEdge) {
			done();
		} else {
			fetchStub.returns(Promise.resolve(
				new Response('', {status: 200})
			));


			globals.capturedFormElement = globals.document.createElement('form');
			var url = '/url';
			var screen = new RequestScreen();
			screen.load(url).then(() => {
				assert.ok('"0"', screen.getRequest().headers.get('If-None-Match'));
				done();
			});
		}
	});

	it('should navigate over same protocol the page was viewed on', (done) => {
		fetchStub.returns(Promise.resolve(
			new Response('', {status: 200})
		));

		var screen = new RequestScreen();
		var wrongProtocol = globals.window.location.origin.replace('http', 'https');
		screen.load(wrongProtocol + '/url').then(() => {
			var url = screen.getRequest().url;
			assert.ok(url.indexOf('http:') === 0);
			done();
		});
	});
});
