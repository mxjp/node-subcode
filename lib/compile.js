'use strict';

const htmlEscape = require('escape-html');
const jsStringEscape = require('js-string-escape');
const evalFn = require('./eval-fn');

const parse = require('./parse');

function compile(src, options = {}) {
	const useWith = ('useWith' in options) ? options.useWith : true;
	const isAsync = options.async;
	const context = options.context || {};
	const syntax = options.syntax || {};

	let body = '(context,locals,__w,__wu)=>{';
	if (isAsync) {
		body = 'async' + body;
	}
	if (useWith) {
		body += 'with(context){with(locals){';
	}
	parse(src, {
		plain: value => {
			body += '__w(\'' + jsStringEscape(value) + '\');';
		},
		writeEscaped: value => {
			body += '__w(' + value + ');';
		},
		writeUnescaped: value => {
			body += '__wu(' + value + ');';
		},
		control: value => {
			body += value + ';';
		}
	}, syntax);
	body += useWith ? '}}}' : '}';
	const executor = evalFn(body);

	return (locals = {}) => {
		let html = '';
		const promise = executor(context, locals, value => {
			html += htmlEscape(value);
		}, value => {
			html += value;
		});
		return promise ? promise.then(() => html) : html;
	};
}

module.exports = compile;
