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
exports.on = on;
exports.off = off;
exports.once = once;
exports.emit = emit;
exports.rpc = rpc;
exports.setupNativeLink = setupNativeLink;
exports.destroy = destroy;
var events = {};
var DEFAULT_TIMEOUT = 1000;

function on(type, handler) {
  if (typeof handler !== 'function') {
    throw new Error('Handler must be of type function');
  }
  (events[type] = events[type] || []).push(handler);
}

function off(type, handler) {
  events[type] = (events[type] || []).filter(function (fn) {
    return handler && fn !== handler;
  });
}

function once(type, handler) {
  var newHandler = function newHandler() {
    off(type, newHandler);
    handler.apply(undefined, arguments);
  };
  on(type, newHandler);
}

function emit(type) {
  var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  if (window.webkit && window.webkit.messageHandlers) {
    window.webkit.messageHandlers.nativebridgeiOS.postMessage({ type: type, data: data });
  } else if (window.NativeBridgeAndroid) {
    window.NativeBridgeAndroid.send(JSON.stringify({ type: type, data: data }));
  } else {
    throw new Error('No native bridge defined');
  }
}

function rpc(_ref) {
  var type = _ref.type,
      data = _ref.data,
      resolve = _ref.resolve,
      reject = _ref.reject,
      _ref$timeout = _ref.timeout,
      timeout = _ref$timeout === undefined ? DEFAULT_TIMEOUT : _ref$timeout;

  try {
    var timedout = false;
    var timer = setTimeout(function () {
      timedout = true;
      reject(new Error('RPC for ' + type + ' using ' + data + ' timed out after ' + timeout + 'ms'));
    }, timeout);
    var done = function done(args) {
      clearTimeout(timer);
      if (args.errors) {
        reject(new Error(args.errors));
      } else if (!timedout) {
        resolve(args);
      }
    };
    once(type, done);
    emit(type, data);
  } catch (e) {
    reject(e);
  }
}
function onNative(_ref2) {
  var _ref2$detail = _ref2.detail,
      type = _ref2$detail.type,
      data = _ref2$detail.data;

  (events[type] || []).forEach(function (handler) {
    return handler(data);
  });
}

function setupNativeLink() {
  window.addEventListener('nativebridge', onNative);
}

function destroy() {
  Object.keys(events).forEach(function (type) {
    Object.keys(events[type]).forEach(function (handler) {
      delete events[type][handler];
    });
    delete events[type];
  });
  window.removeEventListener('nativebridge', onNative);
}

if (typeof window !== 'undefined') {
  setupNativeLink();
}

/***/ })
/******/ ]);
});
//# sourceMappingURL=nativebridge.js.map