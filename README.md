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
{
	// Variable length:
	open: '{{',
	close: '}}',

	// Fixed length:
	writeEscaped: '=',
	writeUnescaped: '-',
	comment: '#',
	escape: open[open.length - 1]
}
```
Remember that the syntax configuration is not validated and that a wrong syntax can lead to strange errors.
