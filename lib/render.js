'use strict';

const compile = require('./compile');

async function render(src, locals, options) {
	return (await compile(src, options))(locals);
}

async function renderFile(filename, locals, options) {
	return (await compile.file(filename, options))(locals);
}

module.exports = render;
module.exports.file = renderFile;
