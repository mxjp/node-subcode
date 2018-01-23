# subcode
[![Travis](https://img.shields.io/travis/mpt0/node-subcode.svg)]()
[![npm](https://img.shields.io/npm/v/subcode.svg)]()
[![npm](https://img.shields.io/npm/l/subcode.svg)]()

## Overview
A bootstrapped javascript template engine that features compile and runtime control code, custom syntax, compile-time includes, async templates and much more.

+ [Installation](#installation)
+ [Syntax](#syntax)
	+ [Runtime output](#runtime-output)
	+ [Runtime control code](#runtime-control-code)
	+ [Compile-time code](#compile-time-code)
+ [Compilation API](#compilation-api)
	+ [Compile-time context](#compile-time-context)
	+ [Compile-time extensions](#compile-time-extensions)
	+ [Caching compiled templates](#caching-compiled-templates)
	+ [Custom syntax](#custom-syntax)
	+ [Async templates](#async-templates)
+ [Parser API](#parser-api)
+ [Development notes](#development-notes)

<br/>



# Installation
```bash
npm install subcode
```

<br/>



# Syntax
| Syntax | Function |
|-|-|
| `<?= some code ?>` | Output html escaped |
| `<?- some code ?>` | Output unescaped |
| `<? some code ?>` | Runtime control code |
| `<?: some code ?>` | Async code that is executed at compile time. `await` can be used. |
| `<?# comment ?>` | A comment with no output. |
| `<??` | Outputs `<?` |

## Runtime Output
There are two types of output:

| Type | Example |
|-|-|
| Html-escaped output | `<?= 'a & b' ?>` outputs `a &amp; b` |
| Unescaped output | `<?- 'a & b' ?>` outputs `a & b` |

> Never put a semicolon at the end of an output tag. Something like `<?= some.code; ?>` will cause load errors!

## Runtime Control Code
Runtime control code is just normal javascript code that is executed while rendering the template.<br/>
**A few examples:**
```html
<? if (some.condition) { ?>
	<h1><?= output.some.heading ?></h1>
<? } ?>

<ul>
	<? for (const item of items) { ?>
		<li><?= item.name ?></li>
	<? } ?>
</ul>
```

## Compile-time Code
Compile-time code is used to extend the compiled render function. It is executed while building the render function so that it can embed custom code like included templates, embedded resources or other utility. In compile-time code, `await` can be used.

<br/>



# Compilation API
```js
const {compile} = require('subcode');

// Compile a template directly:
const template1 = await compile(src, options);

// Or compile from file:
const template2 = await compile.file(filename, options);

// Render a template:
const html = template(locals);
```
+ src `<string>` - The template code.
+ filename `<string>` - The template filename.
+ options `<object>` - Optional compilation options:
	+ syntax `<object>` - A custom syntax definition as described below.
	+ filename `<string>` - The filename of the template used for the module system and relative includes. This option will be set automatically when using `compile.file`
	+ encoding `<string>` - The encoding for reading template files. Default is `'utf8'`
	+ extend `<function>` - A function that is called with the compile time context for each template before running the bootstrapped compiler.
	+ cache `<object>` - The cache that is used for caching compiled templates.
	+ async `<boolean>` - True to compile to an async render function so that `await` can be used from runtime template code.
+ returns `<function>` - The template render function with a single argument:
	+ locals `<object>` - The locals that are available as variables in template runtime code.
	+ returns `<string>` - A string of rendered html.

## Compile-time Context
All properties from the compile-time context are available from compile-time code like global variables.

#### async context.include(name, request[, options])
Used for including template files.
```html
<!-- Include the template: -->
<?: await include('myTemplate', 'path/to/template.html'); ?>

<!-- Use the template: -->
<?- myTemplate(locals) ?>
```
+ name `<string>` - The name of the embedded render function.
+ request `<string>` - The filename to include. Relative paths require the `filename` compile option in the current template.
+ options `<object>` - An object with compile options expect that the `syntax`, `extend`, `encoding` and `cache` options will default to the current template's options.

#### context.template(name, [options, ]body)
Compile a nested template into an embedded render function.
```html
<?: template('myTemplate', () => { ?>
	<!-- The template body is just template code! -->
	<p><?= text ?></p>
<?: }); ?>

<!-- Use the template: -->
<?- myTemplate({text: 'Hello World'}) ?>
```
+ name `<string>` - The name of the embedded render function.
+ options `<object>` - An object which may set the `async` compile option.
+ body `<function>` - The body of a template.

#### context.write(code)
Write javascript code to the render function.
```html
<!-- Embed some data: -->
<?: write('const magic = 42;'); ?>

<!-- Use at runtime: -->
<?= magic ?>
```
+ code `<string>` - Some javascript to write. If the passed code should be independent from other parts in the render function, make sure to append a semicolon at the end.

#### context.stringEscape(str)
A function for string-escaping text.
```html
<?: write('const text = "' + stringEscape('Some"text') + '";'); ?>
<?= text ?>
```
+ str `<string>` - Any text to string-escape.
+ returns `<string>` - The escaped text.

#### context.require(request)
The `require` function. The `filename` compile option is required for relative includes.
```html
<?: const module = require('module'); ?>
```

#### context.filename
The filename of the current template if the `filename` compile option is set, otherwise null.

#### context.dirname
The directory name of the current template if the `filename` compile option is set, otherwise null.

## Compile-time extensions
The compile time context can be extended from the compilation api using the `extend` compile option.
The extend option specifies a function that is called for each compile-time context before a template is compiled. From this you can extend the context itself:
```js
const template = await compile('<?: example(); ?><?= magic ?>', {
	extend(context) {
		// When calling the example function from compile-time code
		// it will embed a constant into the template's runtime code:
		context.example = () => {
			context.write('const magic = 42;');
		};
	}
});

template(); // -> 42
```

## Caching compiled templates
Caching compiled template code can speed up compilation of templates with includes. To take advantage of caching you have to specify the `cache` compile option.
```js
cache: {
	set(filename, code) {
	},
	get(filename) {
	}
}
```
+ set `<function>` - A function for setting a cache entry.
	+ filename `<string>` - The filename that is used as the key.
	+ code `<string>` - The compiled template code.
+ get `<function>` - A function for getting a cache entry.
	+ filename `<string>` - The filename that was used as the key.
	+ returns `<string> | undefined` - The compiled template code or undefined if no entry exists with the specified filename.

You can also use a `Map` object for caching templates.
```js
cache: new Map()
```

## Custom syntax
Custom syntax can be defined using the `syntax` compile option. The syntax option for the default syntax would look like this:
```js
syntax: {
	// Variable length:
	open: '<?',
	close: '?>',

	// Fixed length:
	compilerControl: ':',
	writeEscaped: '=',
	writeUnescaped: '-',
	comment: '#',
	escape: open[open.length - 1]
}
```
Note that a custom syntax configuration is not validated. Syntax configuration is not checked for errors. To ensure that everything is correct, the following guidelines should be followed:
+ All options have a different value.
+ Variable length options have a length of at least 1.
+ Fixed length options have a length of 1.

## Async templates
Asynchronous templates can be compiled by setting the `async` option.
```js
const template = await compile('...', {async: true});

// Render an async template:
const html = await template(locals);
```

In async templates you can use `await`:
```html
<?= await getValue() ?>
```

<br/>



# Parser API
The parser api gives access to the internal parser of subcode.
```js
const {parse} = require('subcode');

parse(src, output, syntax);
```
+ src `<string>` - The template code.
+ output `<object>` - The parser output that has to implement several output functions. The output functions are called while parsing the template:
	+ `plain(html)` - Called with html code to output.
	+ `compilerControl(js)` - Called with compile-time code.
	+ `writeEscaped(js)` - Called with runtime code to output html-escaped.
	+ `writeUnescaped(js)` - Called with runtime code to output unescaped.
	+ `control(js)` - Called with runtime control code.
+ syntax `<object>` - An optional syntax configuration as described above.

<br/>



# Development notes

#### Running tests
```bash
npm test
```

#### Running tests while developing
```bash
npm run dev
```
