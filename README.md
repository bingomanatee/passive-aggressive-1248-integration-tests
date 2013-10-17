passive-aggressive-1248-integration-tests
=========================================

selenium tests for passive-aggressive-1248

This is the first POC for how to run Selenium with node.

Note that any site - not just a node site - can be tested this way.

## SETUP/ENVIRONMENT

This suite runs on Mac OSX. Before running the tests, two things must be true.

0. You must run `npm install` in the root directoy to install your node_modules.
1. The chrome driver must be on a path in your `$PATH` environment variable.
2. The selenium server must be running.
3. You must have the Chrome browser.

(note you do NOT have to kill/restart the selenium server between tests.)

Note that both the selenium server and chrome driver are frequently updated -- do not rely on these files being current.

## RUNNING THE TESTS

each test is a self contained node script; the currently runnable tests include

* `/tests/navigation_tests.js`

``` bash

node tests/navigation_tests.js

```

will execute the suite.