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
/******/ 	return __webpack_require__(__webpack_require__.s = 1);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */,
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var button = document.querySelector('button');
var bridge = Object.assign({}, window.nativebridge);
var clearButton = document.getElementById('clear');
var payloadArea = document.getElementById('payload');
var counter = 0;
var simulationCb = document.getElementById('simulation');
var output = document.getElementById('output');
console.log('nativebridge:', bridge);

var dispatchCustomEvent = function dispatchCustomEvent(type, data) {
  window.dispatchEvent(new window.CustomEvent('nativebridge', { detail: { type: type, data: data } }));
};

var backup = window.webkit;

// mocked (injected) iOs handler
function postMessage(_ref) {
  var type = _ref.type,
      data = _ref.data;

  if (window.webkit !== backup) {
    if (type === 'gaConf') {
      data.cid = 'MOCK_CID';
    } else if (type === 'test') {
      data.echo = true;
    } else {
      data = {
        errors: [{ message: 'mock error', errorCode: 1 }]
      };
    }
    data.simulation = true;
  }
  dispatchCustomEvent(type, data);
}

function setupSimulator() {
  if (simulationCb.checked) {
    window.webkit = { messageHandlers: { nativebridgeiOS: { postMessage: postMessage } } };
  } else {
    window.webkit = backup;
  }
}

bridge.on('error', function () {
  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  output.insertAdjacentHTML('afterbegin', '<pre>' + counter++ + ' - From native: ' + args + ' </pre>');
});

button.addEventListener('click', function (event) {
  setupSimulator();

  var _JSON$parse = JSON.parse(payloadArea.innerHTML),
      type = _JSON$parse.type,
      json = _JSON$parse.json;

  var cb = function cb(payload) {
    bridge.off(type, cb);
    var json = JSON.stringify(payload, null, '  ');
    output.insertAdjacentHTML('afterbegin', '<pre>' + counter++ + ' - From native: ' + json + ' </pre>');
  };
  bridge.on(type, cb);
  bridge.emit(type, json);
});

clearButton.addEventListener('click', function (event) {
  output.innerHTML = ' ';
});

/***/ })
/******/ ]);
});
//# sourceMappingURL=test.js.map