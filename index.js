var wd = require('wd')
    , assert = require('assert')
    , browser = wd.remote();

browser.init({
    browserName:'firefox'
    , tags : ["examples"]
    , name: "This is an example test"
}, function() {

    browser.get("http://passive-agressive-1248.herokuapp.com/ ", function() {
        browser.title(function(err, title) {
            console.log('result of title: %s, %s', err, title);
            assert.equal(title, 'Passive Aggressive 1248', 'title is equal');
            browser.quit();
        });
    });
});