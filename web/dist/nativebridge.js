(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["nativebridge"] = factory();
	else
		root["nativebridge"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "/";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.on = on;
exports.off = off;
exports.once = once;
exports.emit = emit;
exports.validateRpcInput = validateRpcInput;
exports.rpc = rpc;
exports.setupNativeLink = setupNativeLink;
exports.destroy = destroy;
var DEFAULT_TIMEOUT = 1000;
var events = exports.events = {};

function on(topic, handler) {
  if (typeof topic !== 'string') {
    throw new Error('topic must be a string');
  }
  if (typeof handler !== 'function') {
    throw new Error('Handler must be of topic function');
  }
  (events[topic] = events[topic] || []).push(handler);
}

function off(topic, handler) {
  if (typeof topic !== 'string') {
    throw new Error('topic must be a string');
  }
  events[topic] = (events[topic] || []).filter(function (fn) {
    return handler && fn !== handler;
  });
  if (events[topic].length === 0) {
    delete events[topic];
  }
}

function once(topic, handler) {
  if (typeof type !== 'string') {
    throw new Error('type must be a string');
  }
  if (typeof handler !== 'function') {
    throw new Error('Handler must be of type function');
  }
  var newHandler = function newHandler() {
    off(topic, newHandler);
    handler.apply(undefined, arguments);
  };
  on(topic, newHandler);
}

function emit(topic) {
  var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  if (window.webkit && window.webkit.messageHandlers) {
    window.webkit.messageHandlers.nativebridgeiOS.postMessage({ topic: topic, data: data });
  } else if (window.NativeBridgeAndroid) {
    window.NativeBridgeAndroid.send(JSON.stringify({ topic: topic, data: data }));
  } else {
    throw new Error('No native bridge defined');
  }
}

function validateRpcInput(_ref) {
  var topic = _ref.topic,
      data = _ref.data,
      resolve = _ref.resolve,
      reject = _ref.reject,
      timeout = _ref.timeout;

  if (typeof topic !== 'string') {
    throw TypeError('topic argument must be a String');
  }
  if (data === null || (typeof data === 'undefined' ? 'undefined' : _typeof(data)) !== 'object') {
    throw TypeError('data argument must be an Object');
  }
  if (typeof resolve !== 'function') {
    throw new TypeError('resolve must be a function');
  }
  if (typeof reject !== 'function') {
    throw new TypeError('resolve must be a function');
  }
  if (typeof timeout !== 'number') {
    throw new TypeError('timeout must be a number');
  }
  return true;
}

function rpc(_ref2) {
  var topic = _ref2.topic,
      data = _ref2.data,
      resolve = _ref2.resolve,
      reject = _ref2.reject,
      _ref2$timeout = _ref2.timeout,
      timeout = _ref2$timeout === undefined ? DEFAULT_TIMEOUT : _ref2$timeout;

  try {
    validateRpcInput({ topic: topic, resolve: resolve, reject: reject, data: data, timeout: timeout });
    var timedout = false;
    var timer = setTimeout(function () {
      timedout = true;
      reject(new Error('RPC for ' + topic + ' using ' + data + ' timed out after ' + timeout + 'ms'));
    }, timeout);
    var done = function done(args) {
      clearTimeout(timer);
      if (args.errors) {
        reject(new Error(JSON.stringify(args.errors)));
      } else if (!timedout) {
        resolve(args);
      }
    };
    once(topic, done);
    emit(topic, data);
  } catch (e) {
    reject(e);
  }
}
function onNative(_ref3) {
  var _ref3$detail = _ref3.detail,
      topic = _ref3$detail.topic,
      data = _ref3$detail.data;

  (events[topic] || []).forEach(function (handler) {
    return handler(data);
  });
}

function setupNativeLink() {
  window.addEventListener('nativebridge', onNative);
}

function destroy() {
  Object.keys(events).forEach(function (topic) {
    Object.keys(events[topic]).forEach(function (handler) {
      delete events[topic][handler];
    });
    delete events[topic];
  });
  if (typeof window !== 'undefined') {
    window.removeEventListener('nativebridge', onNative);
  }
}

if (typeof window !== 'undefined') {
  setupNativeLink();
}

/***/ })
/******/ ]);
});
//# sourceMappingURL=nativebridge.js.map