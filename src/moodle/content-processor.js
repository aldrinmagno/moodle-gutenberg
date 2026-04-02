/**
 * Content processor for Gutenberg block markup in Moodle.
 *
 * Handles bidirectional conversion between Gutenberg's comment-delimited
 * block format and Moodle-safe HTML with data attributes.
 *
 * @package    editor_gutenberg
 * @copyright  2026 Aldrin Magno
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Regex matching a Gutenberg block comment pair with its inner content.
 *
 * Groups: 1=block name, 2=JSON attrs (optional), 3=inner HTML
 */
const BLOCK_REGEX =
	/<!--\s+wp:([a-z][a-z0-9-]*(?:\/[a-z][a-z0-9-]*)?)\s*(\{[^}]*\})?\s*-->([\s\S]*?)<!--\s+\/wp:\1\s*-->/g;

/**
 * Check whether content contains Gutenberg block comments.
 *
 * @param {string} content Content to check.
 * @return {boolean} True if block comments are present.
 */
export function hasBlockComments( content ) {
	return /<!--\s+wp:/.test( content );
}

/**
 * Escape a string for safe use in an HTML attribute value.
 *
 * @param {string} str The string to escape.
 * @return {string} Escaped string.
 */
function escapeAttr( str ) {
	return str
		.replace( /&/g, '&amp;' )
		.replace( /"/g, '&quot;' )
		.replace( /'/g, '&#39;' )
		.replace( /</g, '&lt;' )
		.replace( />/g, '&gt;' );
}

/**
 * Inject data-gutenberg-block and data-gutenberg-attrs onto the
 * first HTML element inside a block's inner content.
 *
 * @param {string} html The inner HTML of a block.
 * @param {string} blockName The block name (e.g. "paragraph" or "moodle/callout-box").
 * @param {string} attrs JSON attribute string (may be empty).
 * @return {string} HTML with data attributes on the first element.
 */
function injectDataAttributes( html, blockName, attrs ) {
	const trimmed = html.replace( /^\n+/, '' );

	// Already has data attributes — skip.
	if ( trimmed.indexOf( 'data-gutenberg-block' ) !== -1 ) {
		return html;
	}

	// Find the first opening HTML tag.
	const tagMatch = trimmed.match( /^(<[a-z][a-z0-9]*)([\s>])/i );
	if ( ! tagMatch ) {
		// No tag found (raw text). Wrap in a span.
		const attrStr = attrs ? ` data-gutenberg-attrs='${ escapeAttr( attrs ) }'` : '';
		return `<span data-gutenberg-block="${ escapeAttr( blockName ) }"${ attrStr }>${ html }</span>`;
	}

	// Insert data attributes after the tag name.
	const insertPos = tagMatch.index + tagMatch[ 1 ].length;
	let dataAttrs = ` data-gutenberg-block="${ escapeAttr( blockName ) }"`;
	if ( attrs ) {
		dataAttrs += ` data-gutenberg-attrs='${ escapeAttr( attrs ) }'`;
	}

	return trimmed.slice( 0, insertPos ) + dataAttrs + trimmed.slice( insertPos );
}

/**
 * Process Gutenberg output for storage in Moodle.
 *
 * Adds data-gutenberg-block attributes to the first HTML element
 * inside each block as a redundant marker that survives HTMLPurifier.
 * Preserves the original block comment delimiters.
 *
 * @param {string} content Raw serialized Gutenberg output.
 * @return {string} Content with data attributes added.
 */
export function prepareForStorage( content ) {
	if ( ! content || ! hasBlockComments( content ) ) {
		return content;
	}

	return content.replace( BLOCK_REGEX, function( _match, blockName, attrs, inner ) {
		const processedInner = injectDataAttributes( inner, blockName, attrs || '' );
		const attrStr = attrs ? ` ${ attrs }` : '';
		return `<!-- wp:${ blockName }${ attrStr } -->${ processedInner }<!-- /wp:${ blockName } -->`;
	} );
}

/**
 * Reconstruct block comments from data attributes.
 *
 * Used when content was stored through a path that stripped
 * HTML comments but preserved data attributes.
 *
 * @param {string} html HTML with data attributes but no block comments.
 * @return {string} HTML with block comments restored.
 */
export function reconstructBlockComments( html ) {
	if ( ! html || html.indexOf( 'data-gutenberg-block' ) === -1 ) {
		return html;
	}

	return html.replace(
		/<([a-z][a-z0-9]*)\s+[^>]*?data-gutenberg-block="([^"]*)"(?:\s+[^>]*?data-gutenberg-attrs='([^']*)')?[^>]*>[\s\S]*?<\/\1>/gi,
		function( fullMatch, _tag, blockName, attrs ) {
			const decodedAttrs = attrs
				? ' ' + attrs.replace( /&amp;/g, '&' ).replace( /&quot;/g, '"' ).replace( /&#39;/g, "'" ).replace( /&lt;/g, '<' ).replace( /&gt;/g, '>' )
				: '';
			return `<!-- wp:${ blockName }${ decodedAttrs } -->\n${ fullMatch }\n<!-- /wp:${ blockName } -->`;
		}
	);
}

/**
 * Prepare content for loading into the Gutenberg editor.
 *
 * If block comments are present, returns as-is. If stripped,
 * reconstructs from data attributes.
 *
 * @param {string} content Content from Moodle database.
 * @return {string} Content ready for Gutenberg parser.
 */
export function prepareForEditor( content ) {
	if ( ! content ) {
		return content;
	}

	if ( hasBlockComments( content ) ) {
		return content;
	}

	return reconstructBlockComments( content );
}
