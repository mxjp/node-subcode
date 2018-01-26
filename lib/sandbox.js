
const __args = [
	'__context',

	// Undefined arguments for hiding module specific globals:
	'__dirname',
	'__filename',
	'exports',
	'module',
	'require'
];

function __sandbox(__src, __context) {
	return eval(`(${__args.join(',')})=>{with(__context){return ${__src}}}`)(__context);
}

module.exports = __sandbox;
