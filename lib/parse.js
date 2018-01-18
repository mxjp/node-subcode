'use strict';

function parse(src, output, syntax = {}) {
	const OPEN = syntax.open || '<?';
	const CLOSE = syntax.close || '?>';
	const COMPILER_CONTROL = syntax.compilerControl || ':';
	const WRITE_ESCAPED = syntax.writeEscaped || '=';
	const WRITE_UNESCAPED = syntax.writeUnescaped || '-';
	const COMMENT = syntax.comment || '#';
	const ESCAPE = syntax.escape || OPEN[OPEN.length - 1];

	const {
		plain,
		compilerControl,
		writeEscaped,
		writeUnescaped,
		control
	} = output;

	const TAGS = {
		[COMPILER_CONTROL]: parseCodeAs(compilerControl),
		[WRITE_ESCAPED]: parseCodeAs(writeEscaped),
		[WRITE_UNESCAPED]: parseCodeAs(writeUnescaped),
		[COMMENT]: parseComment,
		[ESCAPE]: parseEscape
	};

	let pos = 0;
	let current = parseHtml;

	function error(message, causeIndex = pos) {
		let line = 0;
		let linePos = 0;
		for (let i = 0; i < causeIndex; i++) {
			if (src[i] === '\n') {
				line++;
				linePos = 0;
			} else {
				linePos++;
			}
		}

		const err = new Error(message + ` (${line + 1}:${linePos + 1})`);
		err.pos = {line, linePos, index: causeIndex};
		throw err;
	}

	function isIndexOf(match) {
		for (let i = 0; i < match.length; i++) {
			if (src[pos + i] !== match[i]) {
				return false;
			}
		}
		return true;
	}

	function indexOfStringLiteralEnd(delimiter, start) {
		for (let i = start; i < src.length; i++) {
			if (src[i] === '\\') {
				i++;
			} else if (src[i] === delimiter) {
				return i;
			}
		}
		error('Expected end of string literal.');
	}

	function parseHtml() {
		const open = src.indexOf(OPEN, pos);
		if (open < 0) {
			if (pos < src.length) {
				plain(src.slice(pos, src.length));
			}
			pos = src.length;
			return null;
		}
		if (pos < open) {
			plain(src.slice(pos, open));
		}
		pos = open + OPEN.length;
		return parseTag;
	}

	function parseTag() {
		const type = src[pos];
		const next = TAGS[type];
		if (next) {
			pos++;
			return next;
		}
		return parseCodeAs(control);
	}

	function parseCodeAs(outfn) {
		return function () {
			const start = pos;
			while (pos < src.length) {
				if (isIndexOf('/*')) {
					const end = src.indexOf('*/', pos + 2);
					if (end < 0) {
						error('Expected */');
					} else {
						pos = end + 2;
					}
				} else if (isIndexOf('//')) {
					const end = src.indexOf('\n', pos + 2);
					if (end < 0) {
						error('Expected end of line.');
					} else {
						pos = end + 1;
					}
				} else if (src[pos] === '\'') {
					pos = indexOfStringLiteralEnd('\'', pos + 1) + 1;
				} else if (src[pos] === '"') {
					pos = indexOfStringLiteralEnd('"', pos + 1) + 1;
				} else if (src[pos] === '`') {
					pos = indexOfStringLiteralEnd('`', pos + 1) + 1;
				} else if (isIndexOf(CLOSE)) {
					outfn(src.slice(start, pos));
					pos += CLOSE.length;
					return parseHtml;
				} else {
					pos++;
				}
			}
		};
	}

	function parseComment() {
		const end = src.indexOf(CLOSE, pos);
		if (end < 0) {
			error('Expected ' + CLOSE);
		} else {
			pos = end + CLOSE.length;
			return parseHtml;
		}
	}

	function parseEscape() {
		plain(OPEN);
		return parseHtml;
	}

	while (current) {
		current = current();
	}
}

module.exports = parse;
