/**
 * Moodle entry point for the Isolated Block Editor.
 *
 * Adapted from src/browser/index.js for Moodle's AMD module system.
 * Exports functions instead of setting window globals.
 *
 * @package    editor_gutenberg
 * @copyright  2026 Aldrin Magno
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * WordPress dependencies
 */
import { createRoot } from '@wordpress/element';

/**
 * Internal dependencies
 */
import IsolatedBlockEditor from '../index';
import './style.scss';

/** @typedef {import('../index').BlockEditorSettings} BlockEditorSettings */

/**
 * Map of textarea elements to their editor instances.
 *
 * @type {Map<HTMLTextAreaElement, {root: Object, container: HTMLDivElement, textarea: HTMLTextAreaElement}>}
 */
const instances = new Map();

/**
 * Default isolated editor settings for Moodle.
 *
 * @type {BlockEditorSettings}
 */
const defaultSettings = {
	iso: {
		moreMenu: false,
	},
};

/**
 * Determine if content contains Gutenberg block markup.
 *
 * @param {string} content - Content to check.
 * @return {boolean} True if content contains block comments.
 */
function hasBlockContent( content ) {
	return content.indexOf( '<!--' ) !== -1;
}

/**
 * Load initial content from a textarea into block editor format.
 *
 * @param {string} content - Raw textarea content.
 * @param {Function} parser - Gutenberg block parser.
 * @param {Function} rawHandler - Gutenberg raw HTML handler.
 * @return {object[]} Parsed block objects.
 */
function loadContent( content, parser, rawHandler ) {
	if ( hasBlockContent( content ) ) {
		return parser( content );
	}

	return rawHandler( { HTML: content } );
}

/**
 * Attach the Gutenberg editor to a textarea element.
 *
 * Creates a container div after the textarea, hides the textarea,
 * and mounts the IsolatedBlockEditor React component. Content changes
 * are automatically synced back to the textarea value.
 *
 * @param {HTMLTextAreaElement} textarea - The textarea to replace.
 * @param {BlockEditorSettings} userSettings - Optional editor settings.
 * @return {Object|undefined} The editor instance, or undefined if already attached or invalid.
 */
export function attachEditor( textarea, userSettings = {} ) {
	// Don't re-initialize.
	if ( instances.has( textarea ) ) {
		return instances.get( textarea );
	}

	// Verify it's a textarea.
	if ( textarea.nodeName.toLowerCase() !== 'textarea' ) {
		return;
	}

	// Create container after the textarea.
	const container = document.createElement( 'div' );
	container.classList.add( 'gutenberg-editor-container' );
	textarea.parentNode.insertBefore( container, textarea.nextSibling );
	textarea.style.display = 'none';

	// Merge settings.
	const mergedSettings = {
		...defaultSettings,
		...userSettings,
		iso: {
			...defaultSettings.iso,
			...( userSettings.iso || {} ),
		},
	};

	// Mount the React editor.
	const root = createRoot( container );
	root.render(
		<IsolatedBlockEditor
			settings={ mergedSettings }
			onLoad={ ( parser, rawHandler ) => loadContent( textarea.value, parser, rawHandler ) }
			onSaveContent={ ( content ) => {
				textarea.value = content;
			} }
			onError={ () => {
				// eslint-disable-next-line no-console
				console.error( '[editor_gutenberg] Block editor encountered an error.' );
			} }
		></IsolatedBlockEditor>
	);

	const instance = { root, container, textarea };
	instances.set( textarea, instance );

	return instance;
}

/**
 * Detach the Gutenberg editor from a textarea element.
 *
 * Unmounts the React component, removes the container, and restores
 * the textarea visibility.
 *
 * @param {HTMLTextAreaElement} textarea - The textarea to restore.
 */
export function detachEditor( textarea ) {
	const instance = instances.get( textarea );
	if ( ! instance ) {
		return;
	}

	instance.root.unmount();
	instance.container.parentNode.removeChild( instance.container );
	textarea.style.display = '';
	instances.delete( textarea );
}

/**
 * Get the editor instance for a textarea element.
 *
 * @param {HTMLTextAreaElement} textarea - The textarea element.
 * @return {Object|undefined} The editor instance, or undefined.
 */
export function getInstanceForElement( textarea ) {
	return instances.get( textarea );
}
