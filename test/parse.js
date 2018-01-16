'use strict';

const test = require('ava');
const {parse} = require('..');

const PLAIN = 0;
const C_CONTROL = 4;
const W_ESCAPED = 1;
const W_UNESCAPED = 2;
const CONTROL = 3;

function createOutput() {
	const output = [];
	return {
		output,
		handler: {
			plain: v => output.push([PLAIN, v]),
			compilerControl: v => output.push([C_CONTROL, v]),
			writeEscaped: v => output.push([W_ESCAPED, v]),
			writeUnescaped: v => output.push([W_UNESCAPED, v]),
			control: v => output.push([CONTROL, v])
		}
	};
}

test('parse control', t => {
	const {output, handler} = createOutput();
	parse('a{{: b }}c', handler);
	t.deepEqual(output, [[PLAIN, 'a'], [C_CONTROL, ' b '], [PLAIN, 'c']]);
});

test('write escaped', t => {
	const {output, handler} = createOutput();
	parse('a{{= b }}c', handler);
	t.deepEqual(output, [[PLAIN, 'a'], [W_ESCAPED, ' b '], [PLAIN, 'c']]);
});

test('write unescaped', t => {
	const {output, handler} = createOutput();
	parse('a{{- b }}c', handler);
	t.deepEqual(output, [[PLAIN, 'a'], [W_UNESCAPED, ' b '], [PLAIN, 'c']]);
});

test('control', t => {
	const {output, handler} = createOutput();
	parse('a{{ b }}c', handler);
	t.deepEqual(output, [[PLAIN, 'a'], [CONTROL, ' b '], [PLAIN, 'c']]);
});

test('comment', t => {
	const {output, handler} = createOutput();
	parse('a{{# b }}c', handler);
	t.deepEqual(output, [[PLAIN, 'a'], [PLAIN, 'c']]);
});

test('close tag in literals', t => {
	const {output, handler} = createOutput();
	parse('a{{ \'}}\' }}{{ "}}" }}{{ `}}` }}c', handler);
	t.deepEqual(output, [
		[PLAIN, 'a'],
		[CONTROL, ' \'}}\' '],
		[CONTROL, ' "}}" '],
		[CONTROL, ' `}}` '],
		[PLAIN, 'c']
	]);
});

test('close tag in multi-line comments', t => {
	const {output, handler} = createOutput();
	parse('a{{ /*}}*/ }}c', handler);
	t.deepEqual(output, [
		[PLAIN, 'a'], [CONTROL, ' /*}}*/ '], [PLAIN, 'c']
	]);
});

test('close tag in single-line comments', t => {
	const {output, handler} = createOutput();
	parse('a{{ //}}\n }}c', handler);
	t.deepEqual(output, [
		[PLAIN, 'a'], [CONTROL, ' //}}\n '], [PLAIN, 'c']
	]);
});

test('escape open tag', t => {
	const {output, handler} = createOutput();
	parse('a{{{b', handler);
	t.deepEqual(output, [
		[PLAIN, 'a'],
		[PLAIN, '{{'],
		[PLAIN, 'b']
	]);
});

test('custom escape open tag', t => {
	const {output, handler} = createOutput();
	parse('a{{?b', handler, {
		escape: '?'
	});
	t.deepEqual(output, [
		[PLAIN, 'a'],
		[PLAIN, '{{'],
		[PLAIN, 'b']
	]);
});

test('mixed', t => {
	const {output, handler} = createOutput();
	parse('a{{= b }}{{- c }}{{{{{# d }}{{ e }}{{: f }}', handler);
	t.deepEqual(output, [
		[PLAIN, 'a'],
		[W_ESCAPED, ' b '],
		[W_UNESCAPED, ' c '],
		[PLAIN, '{{'],
		[CONTROL, ' e '],
		[C_CONTROL, ' f ']
	]);
});

test('mixed with custom syntax', t => {
	const {output, handler} = createOutput();
	parse('a<%: b %><%! c %><%%<%/ d %><% e %><%~ f %>', handler, {
		open: '<%',
		close: '%>',
		writeEscaped: ':',
		writeUnescaped: '!',
		comment: '/',
		compilerControl: '~'
	});
	t.deepEqual(output, [
		[PLAIN, 'a'],
		[W_ESCAPED, ' b '],
		[W_UNESCAPED, ' c '],
		[PLAIN, '<%'],
		[CONTROL, ' e '],
		[C_CONTROL, ' f ']
	]);
});

test('parser api errors', t => {
	parse('\n {{: }}', {
		plain() {},
		compilerControl(value, {error}) {
			t.is(value, ' ');
			const err = t.throws(() => {
				error('test');
			});
			t.true(err.message.startsWith('test'));
			t.is(err.pos.line, 1);
		}
	});
});
