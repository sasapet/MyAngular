﻿/* jshint globalstrict: true */
'use strict';
function parse(expr) {
    var lexer = new Lexer();
    var parser = new Parser(lexer);
    return parser.parse(expr);
}

var ESCAPES = {
    'n': '\n', 'f': '\f', 'r': '\r', 't': '\t',
    'v': '\v', '\'': '\'', '"': '"'
};
function Lexer() {
}
Lexer.prototype.lex = function (text) {
    this.text = text;
    this.index = 0;
    this.ch = undefined;
    this.tokens = [];
    while (this.index < this.text.length) {
        this.ch = this.text.charAt(this.index);
        if (this.isNumber(this.ch) ||
        (this.ch === '.' && this.isNumber(this.peek()))) {
            this.readNumber();
        } else if (this.ch === '\'' || this.ch === '"') {
            this.readString(this.ch);
        } else {
            throw 'Unexpected next character: ' + this.ch;
        }
    }
    return this.tokens;
};


Lexer.prototype.isNumber = function (ch) {
    return '0' <= ch && ch <= '9';
};

Lexer.prototype.readString = function (quote) {
    this.index++;
    var rawString = quote;
    var string = '';
    var escape = false;
    while (this.index < this.text.length) {
        var ch = this.text.charAt(this.index);
        rawString += ch;
        if (escape) {
            var replacement = ESCAPES[ch];
            if (replacement) {
                string += replacement;
            } else {
                string += ch;
            }
            escape = false;
        } else if (ch === quote) {
            this.index++;
            this.tokens.push({
                text: rawString,
                constant: true,
                fn: _.constant(string)
            });
            return;
        } else if (ch === '\\') {
            escape = true;
        } else {
            string += ch;
        }
        this.index++;
    }
    throw 'Unmatched quote';
};

Lexer.prototype.readNumber = function () {
    var number = '';
    while (this.index < this.text.length) {
        var ch = this.text.charAt(this.index).toLowerCase();
        if (ch === '.' || this.isNumber(ch)) {
            number += ch;
        } else {
            var nextCh = this.peek();
            var prevCh = number.charAt(number.length - 1);
            if (ch === 'e' && this.isExpOperator(nextCh)) {
                number += ch;
            } else if (this.isExpOperator(ch) && prevCh === 'e' &&
            nextCh && this.isNumber(nextCh)) {
                number += ch;
            } else if (this.isExpOperator(ch) && prevCh === 'e' &&
            (!nextCh || !this.isNumber(nextCh))) {
                throw "Invalid exponent";
            } else {
                break;
            }
        }
        this.index++;
    }
    number = 1 * number;
    this.tokens.push({
        text: number,
        constant: true,
        fn: _.constant(number)
    });
};

Lexer.prototype.isExpOperator = function (ch) {
    return ch === '-' || ch === '+' || this.isNumber(ch);
};

function Parser(lexer) {
    this.lexer = lexer;
}
Parser.prototype.parse = function (text) {
    this.tokens = this.lexer.lex(text);
    return this.primary();
};

Parser.prototype.primary = function () {
    var token = this.tokens[0];
    var primary = token.fn;
    if (token.constant) {
        primary.constant = true;
        primary.literal = true;
    }
    return primary;
};

Lexer.prototype.peek = function () {
    return this.index < this.text.length - 1 ?
    this.text.charAt(this.index + 1) :
    false;
};