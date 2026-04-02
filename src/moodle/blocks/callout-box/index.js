/**
 * Callout Box block registration.
 *
 * A styled content block with icon, title, body, and selectable type
 * (info, warning, success, danger). Renders clean HTML for Moodle themes.
 *
 * @package    editor_gutenberg
 * @copyright  2026 Aldrin Magno
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import { registerBlockType } from '@wordpress/blocks';

import edit from './edit';
import save from './save';
import './style.scss';

registerBlockType( 'moodle/callout-box', {
	title: 'Callout Box',
	description: 'A styled callout box with icon, title, and body text.',
	category: 'design',
	icon: 'info-outline',
	keywords: [ 'alert', 'notice', 'callout', 'warning', 'info' ],

	attributes: {
		type: {
			type: 'string',
			default: 'info',
		},
		title: {
			type: 'string',
			default: '',
		},
		body: {
			type: 'string',
			default: '',
		},
	},

	supports: {
		html: false,
		anchor: true,
	},

	edit,
	save,
} );
