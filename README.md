# subcode
[![Travis](https://img.shields.io/travis/mpt0/node-subcode.svg)]()
[![npm](https://img.shields.io/npm/v/subcode.svg)]()
[![npm](https://img.shields.io/npm/l/subcode.svg)]()

Async embedded javascript templates with focus on performance and flexibility.

## Status
subcode is still under development. Stay tuned ;)

<br/>



# Quick Start
```bash
npm install subcode
```

```js
const {render} = require('subcode');

const html = await render('Hello {{= target }}!', {target: 'World'});
// -> Hello World!
```
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

<br/>



# Compile
The compile function is a thin layer on top of the parser that supports async code and compile time includes.
```js
const {compile} = require('subcode');

const template = await compile(src, options);
template(locals); // -> some html.
```
+ src `<string>` - The template source.
+ options `<object>` - An optional object with the following options:
	+ async `<boolean>` - True, to compile templates to an async function. Default is `false`.
	+ useWith `<boolean>` - True, to use `with` for providing locals. Default is `true`.
	+ filename `<string>` - The filename used for relative compile time includes.
	+ runtimeCache `<object>` - An object for caching included templates as described below.
	+ syntax `<object>` - An syntax object as described above.
	+ encoding `<string>` - The encoding for loading template files. Default is `'utf8'`.
+ returns `<function>` - The compiled template which takes an optional object with locals as first argument:
	+ locals `<object>` - The locals that are available when rendering the template. Default is `{}`

## Includes
#### Compile &amp; embed a template at compile time
Calling `include` from compiler control code will embed a function `functionName` which acts the same as a function returned from compiling a template.
```html
{{: include('functionName', 'filename.html'); }}
```
#### Use the embedded template at runtime
```html
{{- functionName({some: 'locals'}) }}
```
Since the template function is embedded variables from the parent template are available from the included template if not overridden.<br/>
_Note the `-` for not escaping the template output._

## Async templates
Compiling a template with the async option set to `true` allows the use of await inside the template code:
```js
const template = await compile('Some {{= await type }} template.', {async: true});

await template({type: Promise.resolve('async')}); // -> Some async template.
```

## Compile files
```js
const template = await compile.file(filename, options);
```
+ filename - The file to compile.
+ options - The same options passed to the compile function.

## Caching included templates
The object passed with the `runtimeCache` options must implement the following api:
```js
const runtimeCache = {
	get(filename) {
		// Get an entry.
		// Should return undefined if no entry with the specified filename exists.
	},
	set(filename, runtime) {
		// Set an entry.
	}
};

// The runtime cache can also be a Map instance.
const runtimeCache = new Map();
```

<br/>



# Render
The render function is a shortcut for compiling and executing a template in one.
```js
const {render} = require('subcode');

const html = await render(src, locals, options);
// is the same as
const html = await (await compile(src, options))(locals);

// Render a file:
const html = await render.file(filename, locals, options);
```
