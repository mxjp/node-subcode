# asyncejs
Async embedded javascript templates with focus on performance

## Status
Asyncejs is still under development. Stay tuned ;)

<br/>



# Syntax
| Syntax | Description |
|-|-|
| `Hello {{= name }}!` | Output html escaped |
| `Hello {{- name }}!` | Output unescaped |
| `{{ if (some item) { }}` | Control code |
| `{{# ... }}` | Comment
| `{{{` | Output an unescaped `{{`

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
	escape: open[open.length - 1]
};
```
Remember that the syntax configuration is not validated and that a wrong syntax can lead to strange errors.

<br/>



# Parse
The parse function can be used to implement custom template rendering.
```js
const {parse} = require('asyncejs');

parse(src, output, syntax);
```
+ src `<string>` - The template to parse.
+ output `<object>` - The output that is used by the parser as described below.
+ syntax `<object>` - An optional syntax configuration as described above.

## Parser output
```js
const output = {
	plain: html => {
		// TODO: Called with plain html.
	},
	writeEscaped: js => {
		// TODO: Called with js-code, which outputs escaped.
	},
	writeUnescaped: js => {
		// TODO: Called with js-code, which outputs unescaped.
	},
	control: js => {
		// TODO: Called with js-code that is not used as output.
	}
};
```
All output functions from the output object are called while parsing the template.
Parsing the template `Hello {{= name }}!` will result in the following function calls:
```js
plain('Hello ');
writeEscaped(' name ');
plain('!');
```

<br/>



# Compile
The compile function is a simple layer on top of parsing a template which turns a template into a cached function which returns the output html.
```js
const {compile} = require('asyncejs');

const greeter = compile(src, options);
```
+ src `<string>` - The template to render.
+ options `<object>` - An object with the following compile options:
	+ useWith `<boolean>` - True to use `with` for providing `locals` and the `context` object. Default is `true`.
	+ async `<boolean>` - True to compile the template to an async function. This enables using `await` from template code. Default is `false`.
	+ context `<object>` - An object with variables that can be used from template code.
	+ syntax `<object>` - A syntax configuration object as described above.
+ returns `<function>` - A function to render the template which takes the following arguments:
	+ locals `<object>` - An object with variables that can be used from template code.
	+ returns `<string>` - The rendered string.

## Context &amp; locals
If `useWith` is true the context &amp; locals are provided using `with`. When using with, locals will override context variables. Otherwise both objects are available using the `context` &amp; `locals` variable directly.
```js
compile('Hello {{= locals.name }}!', {useWith: false});
```

## Async templates
If `async` is true, the compiled function will be async.
```js
const greeter = compile('Hello {{= await name }}!');

await greeter({
	name: Promise.resolve('Developer')
});
```

<br/>



# Render
The render function is a shortcut for compiling a template and rendering it immediately.
```js
const {render} = require('asyncejs');

render(src, locals, options);

render('Hello {{= name }}!', {name: 'Developer'}); // -> Hello Developer!
```
