# subcode
[![Travis](https://img.shields.io/travis/mpt0/node-subcode.svg)]()
[![npm](https://img.shields.io/npm/v/subcode.svg)]()
[![npm](https://img.shields.io/npm/l/subcode.svg)]()

A bootstrapped javascript template engine that features compile and runtime control code, custom syntax, compile-time includes, async templates and the use of it's internal parser.

## Status
Subcode is still under development. Syntax, api and usage may change in the future. Anything that is marked as deprecated may stop working at any time!

#### Recently deprecated API
+ compile options/context - Deprecated because it does not fit all the needs when extending the compile time context with custom api from outside a template. _Using this option will now print a warning._

<br/>



# Installation
```bash
npm install subcode
```

# Quick Start
_numbers.html_
```html
<ul>
	<? for (const number of numbers) { ?>
	<li><?= number ?></li>
	<? } ?>
</ul>
```

_index.js_
```js
const {compile} = require('subcode');

compile.file('numbers.html').then(numbers => {
	console.log(numbers({
		numbers: [1, 7, 42]
	}));
});
```
**Outputs**
```html
<ul>
	<li>1</li>
	<li>7</li>
	<li>42</li>
</ul>
```



<br/>

# Syntax
| Syntax | Function |
|-|-|
| `<?= some code ?>` | Output html escaped |
| `<?- some code ?>` | Output unescaped |
| `<? some code ?>` | Runtime control code |
| `<?: some code ?>` | Async code that is executed at compile time. `await` can be used. |
| `<??` | Outputs `<?` |

<br/>



## Accessing locals
If locals are accessed directly, an error is throws if the variable does not exist.
```html
<h1><?= title ?></h1>
```

If the `locals` object is used and the variable does not exist no error is thrown and the value will be `undefined`.
```html
<h1><?= locals.title ?></h1>
```

<br/>



## Compile time includes
Include another template file at compile time. The following will embed the template as a function with the specified name:
```html
<?: await include(name, filename, options) ?>
```
+ name `<string>` - The name of the embedded function.
+ filename `<string>` - The filename of the template to include. The `filename` option is required when using a relative path.
+ options `<object>` - An optional object with compile options to override. Unspecified options inherit from the current template expect for the `async` option.

#### Using included templates
Included templates can be rendered at runtime:
```html
<?- name(locals) ?>
```
+ name `<string>` - The name of the template function.
+ locals `<object>` - Locals for rendering the included template.

> Note that variables and locals from scope where the template has been embedded are also available from the included template!

#### Example
_my-template.html_
```html
<p>Some <?= some ?></p>
```
_Main template_
```html
<?: await include ('myTemplate', 'my-template.html') ?>
<?- myTemplate({some: 'locals'}) ?>
<?- myTemplate({some: 'trees'}) ?>
```
**Outputs**
```html
<p>Some locals</p>
<p>Some trees</p>
```

<br/>



## Inline templates
Inline template functions can be defined to reuse them elsewhere.
```html
<?: template(name, options, () => { ?>
	<!-- Template body -->
<?: }) ?>
```
+ name `<string>` - The name of the template function.
+ options `<object>` - An optional object which may set the `async` compiler option.
+ body `<function>` - The function which is the template itself.

#### Using inline templates
Inline templates are used in the same way as included templates.

#### Example
```html
<?: template('myTemplate', () => { ?>
	<h1><?= title ?></h1>
	<p><?= text ?></p>
<?: }) ?>

<?- myTemplate({title: 'My title!', text: 'Some text...'}) ?>
```
**Outputs**
```html
<h1>My title!</h1>
<p>Some text...</p>
```

<br/>



## Emitting control code
Control code can be emitted from compile time code for embedding custom runtime api or resources.
```html
<?: write(code) ?>
```
+ code `<string>` - The runtime control code to emit.

#### Escaping string literals
To escape the content of a string literal use the `stringEscape` function which is also available from the compile time context.
```html
<?: write('const someString = "' + stringEscape('Some string...') + '"'); ?>
```

#### Example
```html
<?: write('const example = 42;') ?>
<p><?= example ?></p>
```
**Outputs**
```html
<p>42</p>
```

<br/>



## Accessing the module system
```html
<?:
	filename // The current filename if the filename option was set.
	dirname // The current dirname if the filename options was set.
?>
<?:
	require(request);
	// The require function.
	// Relative paths are supported if the filename options ise set.
?>
```
#### Example
```html
<?: write(`const filename="' + stringEscape(filename) + '";'); ?>
The filename of this template was "<?= filename ?>".
```

<br/>



## Reserved names
In control and runtime code, names starting with two underscores like `__example` should **NOT** be used.

<br/>



---

# API

## compile
Compile a template.
```js
const {compile} = require('subcode');

const template = await compile(src, options);
```
+ src `<string>` - The source to compile.
+ options `<object>` - An optional object with the following properties:
	+ async `<boolean>` - True to compile the template to an async function. Default is `false`
	+ syntax `<object>` - A custom syntax configuration as described below.
	+ **DEPRECATED:** _context `<object>` - Properties of this object are available from compile time control code. Default is `{}`_
	+ filename `<string>` - The filename used for relative includes.
	+ encoding `<string>` - The encoding used for reading files. Default is `'utf8'`
	+ cache `<object>` - An object for caching compiled templates as described below. Default is none.
+ returns `<function>` - The compiled template function which takes the `locals` argument:
	+ locals `<object>` - Properties of this object are available from runtime output and control code. Default is `{}`
	+ returns `<string>` - The rendered output.

## compile.file
Compile a template from file.
```js
const {compile} = require('subcode');

const template = await compile.file(filename, options);
```
+ filename `<string>` - The file to load and compile.
+ options - The same options object passed to the `compile` function.
	+ The `filename` option will be set to the current filename automatically.

<br/>



## Caching compiled templates
The cache object must implement the following api:

| Function | Description |
|-|-|
| `set(filename, value)` | Set a cache entry |
| `get(filename)` | Get a cache entry. Should return `undefined` if no entry exists. |

You can also use a `Map` instance as cache.

<br/>



## Async templates
Async templates enable the use of `await` from runtime control code.
```js
const template = await compile('<?= await value ?>', {async: true});

await template({
	value: Promise.resolve(42)
}); // -> 42
```

When including templates or defining inline templates, dont forget to set the `async` option to true, if you want the embedded template function to be async too!
```html
<?: include('') ?>
```

#### Using async templates
When using async templates from runtime code, dont forget to use await:
```html
<?- await myAsyncTemplate({some: 'locals'}) ?>
```

<br/>



## Custom syntax
The `syntax` option can be used to change the actual template syntax.<br/>
The configuration object for the default syntax would look like this:
```js
{
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
Every syntax option can be omitted to use the default value.

#### Valid syntax configuration?
Custom syntax is not validated and invalid configuration may cause strange errors. In order to check that everything is correct, the following points should be taken into account:
+ No value conflicts with another or any default.
+ All "fixed length" options have a length of 1.
+ All "variable length" options have a length of 1 or higher.

<br/>



# parse
Gives access to subcodes internal parser.
```js
const {parse} = require('subcode');

parse(src, output, syntax);
```
+ src `<string>` - The source to parse.
+ output `<object>` - An object that should implement the following api:
	+ plain(html) `<function>` - Called for each raw html part.
	+ compilerControl(code) `<function>` - Called for compiler control code.
	+ writeEscaped(code) `<function>` - Called for escaped output code.
	+ writeUnescaped(code) `<function>` - Called for unescaped output code.
	+ control(code) `<function>` - Called for control code.
+ syntax `<object>` - An optional syntax configuration.

When parsing a template, the output functions are called synchronously.<br/>

### Example
The following table shows some example templates with the resulting function calls that are made from the parser:

| Template | Resulting function calls |
|-|-|
| `Hello <?= name ?>!` | `plain('Hello '), writeEscaped(' name '), plain('!')` |
| `<?: some control code ?>` | `control(' some control code ')` |

<br/>



---

# Development

## Running tests
The following will run the linter and all tests once:
```bash
npm test
```

## Running tests during development
The following will run tests and watch for changes in code:
```bash
npm run dev
```
