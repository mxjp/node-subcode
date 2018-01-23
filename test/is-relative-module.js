'use strict';

const test = require('ava');
const isRelative = require('../lib/is-relative-module');

test('absolute paths', t => {
	t.false(isRelative('/../absolute/path'));
	t.false(isRelative('/absolute/path'));
	t.false(isRelative('C:\\absolute\\path'));
});

test('relative paths', t => {
	t.true(isRelative('./relative/path'));
	t.true(isRelative('../relative/path'));
});

test('module paths', t => {
	t.false(isRelative('module'));
	t.false(isRelative('module/path'));
	t.false(isRelative('module/../path'));
	t.false(isRelative('module/./path'));
});
