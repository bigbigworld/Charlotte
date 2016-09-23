require("../custom-util")();
var assert = require("assert");

var a = ["a", "b", "c"];
a.remove("b");
describe("Array.prototype.remove", function(){
    it ("\"b\" should be removed from a", function(){
        assert.deepStrictEqual(a, ["a","c"]);
    })
});
