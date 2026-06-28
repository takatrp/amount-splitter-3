"use strict";

const splitter = require("../app.js");

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
}

assertEqual(splitter.splitAmount(100n, 0).map(String).join(","), "34,33,33", "100 yen target 1");
assertEqual(splitter.splitAmount(100n, 1).map(String).join(","), "33,34,33", "100 yen target 2");
assertEqual(splitter.splitAmount(101n, 2).map(String).join(","), "33,33,35", "101 yen target 3");
assertEqual(splitter.formatAmount(1234567n), "1,234,567", "format amount");
assertEqual(splitter.parseAmount("123,456円").value.toString(), "123456", "parse comma and yen");
assertEqual(String(splitter.parseAmount("12.3").ok), "false", "reject decimal");

console.log("split tests passed");
