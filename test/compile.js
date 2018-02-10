'use strict';

const path = require('path');
const test = require('ava');
const fs = require('fs-extra');
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

test('multi include', async t => {
	const tm = await compile('<?: await includeAll({s1: "simple.html", s2: "simple.html"}) ?><?- s1({text: "1"}) + s2({text: "2"}) ?>', {
		filename: data('test.html')
	});
	t.is(tm(), '<p>1</p>\n<p>2</p>\n');
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

test('extend', async t => {
	const tm = await compile('<?: embedMagic(); ?><?= magic ?>', {
		extend(context) {
			context.embedMagic = () => {
				context.write('const magic = 42;');
			};
		}
	});
	t.is(tm(), '42');
});

test('async templates', async t => {
	const tm = await compile('<?= await value ?>', {async: true});
	t.is(await tm({value: Promise.resolve(42)}), '42');
});

test('to module', async t => {
	const output = data('dist/to-module.js');
	const code = await compile.toModule('<?= "Hello World!" ?>');
	await fs.ensureDir(path.dirname(output));
	await fs.writeFile(output, code, 'utf8');

	try {
		const tm = require(output);
		t.is(tm(), 'Hello World!');
	} finally {
		delete require.cache[output];
	}
});

test('file to module', async t => {
	const output = data('dist/file-to-module.js');
	const code = await compile.fileToModule(data('file-to-module.html'));
	await fs.ensureDir(path.dirname(output));
	await fs.writeFile(output, code, 'utf8');

	try {
		const tm = require(output);
		t.true(tm().startsWith('Hello World!'));
	} finally {
		delete require.cache[output];
	}
});

test('Buffer', async t => {
	await compile('<?: t.true(typeof Buffer === "function") ?>', {
		extend(context) {
			context.t = t;
		}
	});
});

test('timing', async t => {
	// If setImmediate works, it is assumed that other timing functions
	// also work, because the sandbox does not use it explicitly.
	await compile('<?: t.true(typeof setImmediate === "function") ?>', {
		extend(context) {
			context.t = t;
		}
	});
});

test('console', async t => {
	console.subcodeTest = 'test';
	await compile('<?: t.true(console.subcodeTest === "test") ?>', {
		extend(context) {
			context.t = t;
		}
	});
});

test('global', async t => {
	global.subcodeTest = 'test';
	await compile('<?: t.true(global.subcodeTest === "test"); t.true(subcodeTest === "test") ?>', {
		extend(context) {
			context.t = t;
		}
	});
});

test('process', async t => {
	process.subcodeTest = 'test';
	await compile('<?: t.true(process.subcodeTest === "test") ?>', {
		extend(context) {
			context.t = t;
		}
	});
});

test('embed object', async t => {
	const tm = await compile('<?: embedObject("test", {foo: "bar"}) ?><?= test.foo ?>');
	t.is(tm(), 'bar');
});

test('embed object from external code', async t => {
	const tm = await compile('a, <?= test.foo ?>, b', {
		extend(context) {
			context.embedObject('test', {foo: 'bar'});
		}
	});
	t.is(tm(), 'a, bar, b');
});

test('output from compile time code', async t => {
	const tm = await compile('a, <?: output("b") ?>, c');
	t.is(tm(), 'a, b, c');
});
