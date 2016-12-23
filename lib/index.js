'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _lodash = require('lodash.isplainobject');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } } /*
                                                                                                                                                                                                     * Fork IPC - safe and easy fork IPC wrapper.
                                                                                                                                                                                                     */

var CHANNEL = 'FORK_IPC_CHANNEL';

var ACTION = {
  ASK_REGISTER: 'ASK_REGISTER',
  EMIT: 'EMIT',
  EXECUTE: 'EXECUTE',
  REGISTER: 'REGISTER',
  RESULT: 'RESULT'
};

var STATUS = {
  FAIL: 'FAIL',
  OK: 'OK',
  PENDING: 'PENDING'
};

var localEmitter = new _events2.default();

// local variables
var idCounter = 0;
var childrens = {};
var processors = {};
var requestQueue = {};

/*
 * Make request to service, will return promise
 */
function doRequest(domain, command) {
  for (var _len = arguments.length, args = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    args[_key - 2] = arguments[_key];
  }

  var childId = void 0,
      child = void 0;

  if ((0, _lodash2.default)(processors[domain])) {
    childId = processors[domain][command];
    child = childrens[childId];
  }

  return new _bluebird2.default(function (resolve, reject) {
    if (!child) {
      reject('Not supported - domain |' + domain + '|, command |' + command + '|, rejected!');
    } else {
      if (child.killed || child.exitCode !== null) {
        reject('Child died, cant execute domain |' + domain + '|, command |' + command + '|, rejected!');
      } else {
        var id = getID();

        requestQueue[id] = resolve;
        child.send({
          args: args,
          command: command,
          domain: domain,
          id: id,
          channel: CHANNEL,
          type: ACTION.EXECUTE
        });
      }
    }
  });
}

/*
 * Do emit message to parent from child.
 */
function emitToParent(eventName) {
  for (var _len2 = arguments.length, data = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
    data[_key2 - 1] = arguments[_key2];
  }

  process.send({
    data: data,
    eventName: eventName,
    channel: CHANNEL,
    type: ACTION.EMIT
  });
}

/*
 * Subscribe on parent to child message.
 */
function onFromChild(eventName, listener) {
  localEmitter.on(eventName, listener);
}

/*
 * Subscribe on parent to child message for once maessage.
 */
function onceFromChild(eventName, listener) {
  localEmitter.once(eventName, listener);
}

/*
 * Unsubscribe on parent from child message.
 */
function removeChildListener(eventName, listener) {
  localEmitter.removeListener(eventName, listener);
}

/*
 * Register child in parent process
 * actualy subscribe to children messages
 */
function registerChild(child) {
  return new _bluebird2.default(function (resolve, reject) {
    child.on('message', function (message) {
      if ((0, _lodash2.default)(message) && message.channel === CHANNEL) {
        switch (message.type) {
          case ACTION.REGISTER:
            registerProcessor(child, message);
            resolve('registered');
            break;
          case ACTION.RESULT:
            doResponce(message);
            break;
          case ACTION.EMIT:
            processEmited(message);
            break;
          default:
            console.log('Unhandled message type |' + message.type + '| ignored!');
            console.log(message);
        }
      }
    });
    // ask child to do register
    child.send({
      channel: CHANNEL,
      type: ACTION.ASK_REGISTER
    });
  });
}

/*
 * Announce supported services in domain into child proc
 * as is AND set listener to parent AND send message to parent
 */
function servicesAnnouncement(domain, services) {
  var childRegister = function childRegister() {
    process.send({
      domain: domain,
      channel: CHANNEL,
      pid: process.pid,
      services: Object.keys(services),
      type: ACTION.REGISTER
    });
  };

  process.on('message', function (message) {
    if ((0, _lodash2.default)(message) && message.channel === CHANNEL) {
      switch (message.type) {
        case ACTION.ASK_REGISTER:
          childRegister();
          break;
        case ACTION.EXECUTE:
          executeOnChild(domain, services, message).then(function (result) {
            process.send({
              domain: domain,
              result: result,
              channel: CHANNEL,
              id: message.id,
              status: STATUS.OK,
              type: ACTION.RESULT
            });
          }).catch(function (error) {
            // transform error from object to text
            if (error instanceof Error) {
              error = error.message;
            }
            process.send({
              domain: domain,
              error: error,
              channel: CHANNEL,
              id: message.id,
              status: STATUS.FAIL,
              type: ACTION.RESULT
            });
          });
          break;
        default:
          console.log('Child ' + process.argv[1] + ' unknown message');
          console.log(message);
      }
    }
  });
  // in case its late
  childRegister();
}

/*
 * Execute on child request by parent
 */
function executeOnChild(domain, services, message) {
  if (message.domain === domain) {
    if (services[message.command]) {
      return _bluebird2.default.try(function () {
        return services[message.command].apply(services, _toConsumableArray(message.args));
      });
    }
  }
  return _bluebird2.default.reject('unknown execute domain: |' + message.domain + '| command: |' + message.command + '|');
}

/*
 * Send request result to parent
 */
function doResponce(message) {
  if (requestQueue[message.id]) {
    if (message.status === STATUS.OK) {
      requestQueue[message.id](message.result);
    } else if (message.status === STATUS.FAIL) {
      requestQueue[message.id](_bluebird2.default.reject(message.error));
    } else {
      requestQueue[message.id](_bluebird2.default.reject('unknown status |' + message.status + '|'));
    }
  }
}

/*
 * Process emited event on parent
 */
function processEmited(message) {
  localEmitter.emit.apply(localEmitter, [message.eventName].concat(_toConsumableArray(message.data)));
}

/*
 * Register anounced services by child in master
 */
function registerProcessor(child, message) {
  var services = message.services;
  var domain = message.domain;

  var childId = getID();

  if (!Array.isArray(services)) {
    return;
  }

  // save child to storage
  childrens[childId] = child;

  if (!processors[domain]) {
    processors[domain] = {};
  }

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = services[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var command = _step.value;

      if (processors[domain][command]) {
        var oldChild = childrens[processors[domain][command]];
        // just do not re-register identical function
        if (oldChild.pid === child.pid) {
          continue;
        }

        if (!(oldChild.killed || oldChild.exitCode !== null)) {
          // yes, if we are try to register another one command processor while current alive - stop with error
          throw Error('Already registered - domain |' + domain + '|, command |' + command + '|, halt!');
        }
      }
      processors[domain][command] = childId;
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }
}

/*
 * Return new request ID.
 * Its seems simply increment ok
 */
function getID() {
  idCounter += 1;
  return idCounter;
}

exports.default = {
  child: {
    emit: emitToParent,
    servicesAnnouncement: servicesAnnouncement
  },
  parent: {
    execute: doRequest,
    on: onFromChild,
    once: onceFromChild,
    registerChild: registerChild,
    removeListener: removeChildListener
  }
};