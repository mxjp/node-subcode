'use strict';

const vm = require('vm');
const fs = require('fs');
const path = require('path');
const htmlEscape = require('escape-html');
const jsStringEscape = require('js-string-escape');
const parse = require('./parse');

function isRelative(filename) {
	return /(\.|\.\.)[\\/]/.test(filename)
}

/*
	Reserved variable names:
		__x - Externals for rendering the template body.
		__e - Function for html-escaping text.
		__r - Variable for the output result.
*/

function preParse(src, output, syntax) {
	const {
		append,
		compilerControl,
		control
	} = output;

	let appendParts = [];
	function pushAppendParts() {
		if (appendParts.length > 0) {
			append(appendParts);
			appendParts = [];
		}
	}

	parse(src, {
		plain(html) {
			appendParts.push('\'' + jsStringEscape(html) + '\'');
		},
		compilerControl(js) {
			pushAppendParts();
			compilerControl(js);
		},
		writeEscaped(js) {
			appendParts.push('__e(' + js + ')');
		},
		writeUnescaped(js) {
			appendParts.push('(' + js + ')');
		},
		control(js) {
			pushAppendParts();
			control(js);
		}
	}, syntax);
	pushAppendParts();
}

function templateBegin(options) {
	return (options.async ? 'async' : '') + '(locals={})=>{with(locals){let __r=\'\';';
}
function templateEnd() {
	return 'return __r;}}';
}

async function compileCode(src, options = {}) {
	const externals = [];
	function external(value) {
		const index = externals.length;
		externals.push(value);
		return '__x[' + index + ']';
	}

	let compilerBody = '';

	preParse(src, {
		append(parts) {
			compilerBody += 'write(' + external('__r+=' + parts.join('+') + ';') + ');';
		},
		compilerControl(js) {
			compilerBody += js + ';';
		},
		control(js) {
			compilerBody += 'write(' + external(js + ';') + ');';
		}
	}, options.syntax);

	let templateBody = '';
	const context = vm.createContext(options.context ? Object.create(options.context) : {});
	context.include = (name, request, overrides = {}) => {
		if (!path.isAbsolute(request)) {
			if (!options.filename) {
				throw new Error('The filename option is required for relative includes.');
			}
			request = path.join(path.dirname(options.filename), request);
		}

		return compileCodeFromFile(request, Object.assign({
			syntax: options.syntax,
			context: options.context,
			encoding: options.encoding
		}, overrides)).then(code => {
			templateBody += 'const ' + name + '=' + code + ';';
		});
	};
	context.write = code => {
		templateBody += code;
	};
	context.template = (name, options, body) => {
		if (body === undefined) {
			body = options;
			options = {};
		}
		templateBody += 'const ' + name + '=' + templateBegin(options);
		body();
		templateBody += templateEnd() + ';';
	};
	context.__x = externals;
	context.filename = options.filename || null;
	context.dirname = (options.filename && path.dirname(options.filename)) || null;
	context.require = request => {
		if (isRelative(request)) {
			if (!options.filename) {
				throw new Error('Missing filename option.');
			}
			request = path.resolve(context.dirname, request);
		}
		return require(request);
	};
	context.stringEscape = jsStringEscape;
	await vm.runInContext('async()=>{' + compilerBody + '}', context)();
	return templateBegin(options) + templateBody + templateEnd(options);
}

function compileCodeFromFile(filename, options = {}) {
	return new Promise((resolve, reject) => {
		if (options.cache) {
			const code = options.cache.get(filename);
			if (code !== undefined) {
				return code;
			}
		}

		fs.readFile(filename, options.encoding || 'utf8', (err, src) => {
			if (err) {
				reject(err);
			} else {
				const fork = Object.create(options);
				fork.filename = filename;
				compileCode(src, fork).then(code => {
					if (options.cache) {
						options.cache.set(filename, code);
					}
					resolve(code);
				}, reject);
			}
		});
	});
}

function load(code, options) {
	const context = vm.createContext(options.context ? Object.create(options.context) : {});
	context.__e = htmlEscape;
	return vm.runInContext(code, context);
}

function compile(src, options = {}) {
	return compileCode(src, options).then(c => load(c, options));
}

function compileFile(filename, options = {}) {
	return compileCodeFromFile(filename, options).then(c => load(c, options));
}

module.exports = compile;
module.exports.file = compileFile;
module.exports.isRelative = isRelative;
