'use strict';

const path = require('path');
const test = require('ava');
const {render} = require('..');

test('simple', async t => {
	t.is(await render('Hello {{= name }}!', {name: 'Developer'}), 'Hello Developer!');
});

test('file', async t => {
	t.is((await render.file(path.join(__dirname, 'parent.html'))).trim(), 'b');
});

test('async', async t => {
	t.is(await render('{{= await test }}', {test: 'value'}, {async: true}), 'value');
});
