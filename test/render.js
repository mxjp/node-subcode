'use strict';

const test = require('ava');
const {render} = require('..');

test('simple', t => {
	t.is(render('a{{= v }}c', {v: 'b'}), 'abc');
});

test('escaped', t => {
	t.is(render('{{= v }}', {v: '&'}), '&amp;');
});

test('unescaped', t => {
	t.is(render('{{- v }}', {v: '&'}), '&');
});

test('control', t => {
	render('{{ t.pass(); }}', {t});
});

test('context', t => {
	render('{{ t.pass(); }}', {}, {context: {t}});
});

test('async execution', async t => {
	t.is(await render('{{= await v }}', {v: 'a'}, {async: true}), 'a');
});

test('no with', t => {
	t.throws(() => {
		t.is(render('{{= v }}', {v: 'a'}, {useWith: false}), 'a');
	});
	t.is(render('{{= locals.v }}', {v: 'a'}, {useWith: false}), 'a');
});
