# subcode
[![Travis](https://img.shields.io/travis/mpt0/node-subcode.svg)]()
[![npm](https://img.shields.io/npm/v/subcode.svg)]()
[![npm](https://img.shields.io/npm/l/subcode.svg)]()

Async embedded javascript templates with focus on performance

## Status
subcode is still under development. Stay tuned ;)

<br/>



# Syntax
| Syntax | Description |
|-|-|
| `Hello {{= name }}!` | Output html escaped |
| `Hello {{- name }}!` | Output unescaped |
| `{{ if (some item) { }}` | Control code |
| `{{# ... }}` | Comment |
| `{{{` | Output an unescaped `{{` |
| `{{: code }}` | Compiler control code |

## Syntax configuration
The default syntax from the table above would have the following configuration object:
```js
const syntax = {
	// Variable length:
	open: '{{',
	close: '}}',

	// Fixed length:
	writeEscaped: '=',
	writeUnescaped: '-',
	comment: '#',
	escape: open[open.length - 1],
	compilerControl: ':'
};
```
Remember that the syntax configuration is not validated and that a wrong syntax can lead to strange errors.

<br/>



# Parse
The parse function can be used to implement custom template rendering.
```js
const {parse} = require('subcode');

parse(src, output, syntax);
```
+ src `<string>` - The template to parse.
+ output `<object>` - The output that is used by the parser as described below.
+ syntax `<object>` - An optional syntax configuration as described above.

## Parser output
```js
const output = {
	plain(html) {
		// TODO: Called with plain html.
	},
	compilerControl(js) {
		// TODO: Called with js-code that should be interpreted at compile time if supported.
	},
	writeEscaped(js) {
		// TODO: Called with js-code, which outputs escaped.
	},
	writeUnescaped(js) {
		// TODO: Called with js-code, which outputs unescaped.
	},
	control(js) {
		// TODO: Called with js-code that is not used as output.
	}
};
```
All output functions from the output object are called while parsing the template.
Parsing the template `Hello {{= name }}!` will result in the following function calls:
```js
plain('Hello ', api);
writeEscaped(' name ', api);
plain('!', api);
```
