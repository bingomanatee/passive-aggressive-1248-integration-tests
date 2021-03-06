var Q = require('q');
var util = require('util');
var _ = require('underscore');
var _DEBUG = false;

var DEFAULT_WAIT_TIME = 800;

var utils = {

    click: function (browser, selector, done) {

        if (!done) {
            var deferred = Q.defer();
            utils.getCSS(browser, selector).then(function (el) {
                browser.clickElement(el, function () {
                    deferred.resolve();
                });
            }, deferred.reject);
            return deferred.promise;
        } else {
            utils.getCSS(browser, selector, function (err, el) {
                if (err) {
                    done(err);
                } else if (typeof el == 'object') {
                    browser.clickElement(el, done);
                } else {
                    done(new Error('cannot find ' + selector))
                }
            });
        }
    },

    /**
     * determines if an element is visible (and by implication, exists).
     *
     * Note -- this method doesn't actually throw errors; if element is not present, returns false.
     *
     * @param browser {webdriver}
     * @param selector {string}
     * @param timeout {number}
     * @param done {function | null}
     * @returns {promise|*|Q.promise}
     *
     */

    visible: function (browser, selector, timeout, done) {
        if (_.isFunction(timeout)) {
            done = timeout;
            timeout = 0;
        }

        if (!timeout) {
            timeout = 0;
        }

        if (done && _.isFunction(done)) {
            browser.waitForElementByCssSelector(selector, timeout, function () {
                browser.elementByCssIfExists(selector, function (err, element) {
                    if (err) {
                        done(null, false);
                    } else if (element) {
                        browser.isVisible(element, done);
                    } else {
                        done(null, false);
                    }
                });
            });
        } else {
            var deferred = Q.defer();

            browser.waitForElementByCssSelector(selector, timeout, function () {
                browser.elementByCssSelectorIfExists(selector, function (err, element) {
                    if (_DEBUG)  console.log('visible.elementByCssIfExists %s result: %s, %s', selector, err, util.inspect(element));
                    if (err) {
                        deferred.resolve(false);
                    } else if (typeof element == 'object') {
                        browser.isVisible(element, function (err, visible) {
                            if (err) {
                                deferred.resolve(false);
                            } else {
                                deferred.resolve(visible);
                            }
                        })
                    } else {
                        deferred.resolve(false);
                    }
                });

            });

            return deferred.promise;
        }
    },

    getText: function (browser, selector, timeout, done) {
        if (_.isFunction(timeout)) {
            done = timeout;
            timeout = DEFAULT_WAIT_TIME;
        }

        if (!timeout) {
            timeout = DEFAULT_WAIT_TIME;
        }
        if (done) {
            utils.getCSS(browser, selector, timeout, function (err, element) {
                if (err) {
                    done(err);
                } else {
                    browser.text(element, done);
                }
            });
        } else {
            var derferred = Q.defer();

            utils.getCSS(browser, selector, timeout)
                .then(function (element) {
                    browser.text(element, function (err, text) {
                        if (err) {
                            derferred.reject(err);
                        } else {
                            derferred.resolve(text);
                        }
                    })
                }, function (err) {
                    derferred.reject(err);
                });

            return derferred.promise;
        }
    },

    getAttribute: function (browser, selector, attr, timeout, done) {

        if (done) {
            model.getCSS(browser, selector, timeout)
                .then(function (element) {
                    if (element) {
                        try {
                            browser.getAttribute(element, attr, done)
                        } catch (err) {
                            done(err);
                        }

                    } else {
                        done(new Error('cannot find element ' + selector));
                    }
                },
                function (err) {
                    done(err);
                }
            );
        } else {
            var deferred = Q.defer();
            utils.getCSS(browser, selector, timeout)
                .then(function (element) {
                    if (element) {
                        try {
                            browser.getAttribute(element, attr, function(err, value){
                                if (err){
                                    deferred.reject(err);
                                } else {
                                    deferred.resolve(value);
                                }
                            });
                        } catch (err) {
                           deferred.reject(err);
                        }

                    } else {
                        deferred.reject(new Error('cannot find element ' + selector));
                    }
                },
                function (err) {
                    done(err);
                }
            );
            return deferred.promise;
        }

    },

    getCSS: function (browser, selector, timeout, done) {
        if (_.isFunction(timeout)) {
            done = timeout;
            timeout = DEFAULT_WAIT_TIME;
        }

        if (!timeout) {
            timeout = DEFAULT_WAIT_TIME;
        }

        if (done && _.isFunction(done)) {
            browser.waitForElementByCssSelector(selector, timeout, function () {
                browser.elementByCssSelectorIfExists(selector, done);
            });
        } else {
            var deferred = Q.defer();

            browser.waitForElementByCssSelector(selector, timeout, function () {
                browser.elementByCssSelectorIfExists(selector, function (err, element) {
                    if (_DEBUG)   console.log('getCSS %s result: %s, %s', selector, err, util.inspect(element));
                    if (err) {
                        deferred.reject(err);
                    } else if (element) {
                        deferred.resolve(element);
                    } else {
                        deferred.reject(new Error('getCSS cannot find element' + selector))
                    }
                });

            });

            return deferred.promise;
        }
    }

};

module.exports = utils;