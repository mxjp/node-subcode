'use strict';

const compile = require('./compile');

function render(src, locals, options = {}) {
	return compile(src, options)(locals);
}

module.exports = render;
