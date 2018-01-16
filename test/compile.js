'use strict';

const path = require('path');
const test = require('ava');
const {compile} = require('..');

test('simple', async t => {
	const fn = await compile('Hello {{= name }}!');
	t.is(fn({name: 'Developer'}), 'Hello Developer!');
});

test('file', async t => {
	const fn = await compile.file(path.join(__dirname, 'parent.html'));
	t.is(fn().trim(), 'b');
});

test('async', async t => {
	const fn = await compile('{{= await test }}', {async: true});
	t.is(await fn({test: Promise.resolve('value')}), 'value');
});

test('no with', async t => {
	const fn = await compile('{{= test }}', {useWith: false});
	t.throws(() => {
		fn({test: 'value'});
	});

	const fn2 = await compile('{{= locals.test }}', {useWith: false});
	t.is(fn2({test: 'value'}), 'value');
});

test('custom syntax', async t => {
	const fn = await compile('<%= test %>', {
		syntax: {
			open: '<%',
			close: '%>'
		}
	});
	t.is(fn({test: 'value'}), 'value');
});
