'use strict';

const path = require('path');
const test = require('ava');
const {compile} = require('..');

function data(filename) {
	return path.join(__dirname, 'data', filename);
}

test('simple', async t => {
	const tm = await compile('Hello <?= name ?>!');
	t.is(tm({name: 'World'}), 'Hello World!');
});

test('simple file', async t => {
	const tm = await compile.file(data('simple.html'));
	t.true(tm({text: 'Test'}).startsWith('<p>Test</p>'));
});

test('includes', async t => {
	const tm = await compile('<?: await include("simple", "simple.html") ?><?- simple({text: "Included"}) ?>', {
		filename: data('test.html')
	});
	t.true(tm().startsWith('<p>Included</p>'));
});

test('includes, use parent locals', async t => {
	const tm = await compile('<?: await include("simple", "simple.html") ?><?- simple() ?>', {
		filename: data('test.html')
	});
	t.true(tm({text: 'Parent'}).startsWith('<p>Parent</p>'));
});

test('inline', async t => {
	const tm = await compile('<?: template("inline", () => { ?><?= value ?><?: }) ?><?- inline() ?>, <?- inline({value: value * 2}) ?>');
	t.is(tm({value: 7}), '7, 14');
});

test('emit control code', async t => {
	const tm = await compile('<?: write("const value = 42;") ?><?= value ?>');
	t.is(tm(), '42');
});

test('emit control code with escaped literals', async t => {
	const tm = await compile('<?: write("const value = \'" + stringEscape("a\'b") + "\';"); ?><?- value ?>');
	t.is(tm(), 'a\'b');
});

test('filename', async t => {
	const tm = await compile('<?: write("const value = \'" + stringEscape(filename) + "\';"); ?><?- value ?>', {filename: 'a/b.html'});
	t.is(tm(), 'a/b.html');
});

test('dirname', async t => {
	const tm = await compile('<?: write("const value = \'" + stringEscape(dirname) + "\';"); ?><?- value ?>', {filename: 'a/b.html'});
	t.is(tm(), 'a');
});

test('require', async t => {
	const tm = await compile('<?: write("const value = \'" + stringEscape(require("./data/test.json")) + "\';"); ?><?- value ?>', {filename: path.join(__dirname, 'test.html')});
	t.is(tm(), 'test value');
});

test('async templates', async t => {
	const tm = await compile('<?= await value ?>', {async: true});
	t.is(await tm({value: Promise.resolve(42)}), '42');
});
