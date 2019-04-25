//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

// The module 'assert' provides assertion methods from node
import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
// import * as vscode from 'vscode';
import * as sg from '../extension';

// Defines a Mocha test suite to group tests of similar kind together
suite("Extension Tests", function () {

 
    // test("When calling with single line returns expected json", function() {
    //     let body = 'single line',
    //         prefix = 'prfx',
    //         name = 'nm',
    //         description = 'dscr';

    //     let result = sg.generateBlock(body, prefix, name, description);
    //     assert.equal(result.body, body);
    //     assert.equal(result.prefix, prefix);
    //     assert.equal(result.name, name);
    //     assert.equal(result.description, description);
        
    // });
 
    // test("When calling with multi line returns expected json", function() {
    //     let body = 'single line\nsecond line',  
    //         prefix = 'prfx',
    //         name = 'nm',
    //         description = 'dscr';

    //     let result = sg.generateBlock(body, prefix, name, description);
    //     assert.deepEqual(result.body, ['single line', 'second line']);
    //     assert.equal(result.prefix, prefix);
    //     assert.equal(result.name, name);
    //     assert.equal(result.description, description);
        
    // });
 
    // test("That leading whitespaces are trimmed", function() {
    //     let body = '  single line \n\t\tsecond line\t',  
    //         prefix = 'prfx',
    //         name = 'nm',
    //         description = 'dscr';

    //     let result = sg.generateBlock(body, prefix, name, description);
    //     assert.deepEqual(result.body, ['single line ', 'second line\t']);
    //     assert.equal(result.prefix, prefix);
    //     assert.equal(result.name, name);
    //     assert.equal(result.description, description);
        
    // });
});