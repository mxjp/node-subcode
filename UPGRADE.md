# Upgrade Guide

# to subcode 3.0

## accessing locals
Accessing locals without the `locals.` prefix has been removed completely.



<br/>

# to subcode 2.0

## compile-time/require
As `require` from the compile-time context was removed you have to pass the module directly to the compile-time context if needed:
```js
const myModule = require('my-module');

extend(context) {
	context.myModule = myModule;
}
```
You can also provide your own require implementation:
```js
extend(context) {
	context.require = request => {
		if (/^(\.|\.\.)([//\/]|$)/.test(request)) {
			request = path.join(context.dirname, request);
		}
		return require(request);
	};
}
```

## new compile-time globals
Subcode is now using it's own sandbox for compiling and loading templates instead of the `vm` module. Additionally there are some [node globals](README.md#node-globals) available.

## caching compiled templates
Now the `cache` compile option should specify a spec compliant `Map` instance. In addition, keys and values are now filled with internal data.
