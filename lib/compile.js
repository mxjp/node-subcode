'use strict';

const vm = require('vm');
const fs = require('fs');
const path = require('path');
const htmlEscape = require('escape-html');
const jsStringEscape = require('js-string-escape');
const parse = require('./parse');

async function compileRuntime(src, options = {}) {
	const isAsync = ('async' in options) ? options.async : false;
	const useWith = ('useWith' in options) ? options.useWith : true;
	const escapeFn = ('escapeFn' in options) ? options.escapeFn : '__e';
	const parts = [];
	const tasks = [];

	function compileInclude(index, name, request, subOptions = {}) {
		if (!path.isAbsolute(request)) {
			if (!options.filename) {
				throw new Error('The filename options is required for using relative includes.');
			}
			request = path.join(path.dirname(options.filename), request);
		}

		function setRuntimePart(runtime) {
			parts[index] = 'const ' + name + '=' + runtime + ';';
		}

		if (options.runtimeCache) {
			const runtime = options.runtimeCache.get(request);
			if (runtime) {
				setRuntimePart(runtime);
				return;
			}
		}

		return new Promise((resolve, reject) => {
			fs.readFile(request, options.encoding || 'utf8', (err, src) => {
				if (err) {
					reject(err);
				} else {
					const fork = Object.assign(Object.create(options), subOptions);
					fork.filename = request;
					compileRuntime(src, fork).then(runtime => {
						if (options.runtimeCache) {
							options.runtimeCache.set(request, runtime);
						}
						setRuntimePart(runtime);
						resolve();
					}, reject);
				}
			});
		});
	}

	const compilerContext = vm.createContext({
		include(name, request, subOptions) {
			const index = parts.length;
			parts.push('');
			tasks.push(compileInclude(index, name, request, subOptions));
		}
	});

	parse(src, {
		plain(html) {
			parts.push('__r+=\'' + jsStringEscape(html) + '\';');
		},
		compilerControl(code) {
			vm.runInContext(code, compilerContext);
		},
		writeEscaped(code) {
			parts.push('__r+=' + escapeFn + '(' + code + ');');
		},
		writeUnescaped(code) {
			parts.push('__r+=(' + code + ');');
		},
		control(code) {
			parts.push(code + ';');
		}
	}, options.syntax);

	await Promise.all(tasks);

	let runtime = '(locals={})=>{let __r=\'\';';
	if (isAsync) {
		runtime = 'async' + runtime;
	}
	runtime += useWith ? ('with(locals){' + parts.join('') + '}') : parts.join('');
	runtime += 'return __r;}';
	return runtime;
}

function compile(src, options) {
	return compileRuntime(src, options).then(runtime => {
		const context = vm.createContext({__e: htmlEscape});
		return vm.runInContext(runtime, context);
	});
}

function compileFile(filename, options = {}) {
	return new Promise((resolve, reject) => {
		fs.readFile(filename, options.encoding || 'utf8', (err, src) => {
			if (err) {
				reject(err);
			} else {
				const fork = Object.create(options);
				fork.filename = filename;
				compile(src, fork).then(resolve, reject);
			}
		});
	});
}

module.exports = compile;
module.exports.runtime = compileRuntime;
module.exports.file = compileFile;
