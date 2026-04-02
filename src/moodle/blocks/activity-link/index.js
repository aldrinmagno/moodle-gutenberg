/**
 * Activity Link block registration.
 *
 * A block that lets the author pick a Moodle activity from the current
 * course and renders a styled link card. Fetches available activities
 * from the editor_gutenberg_get_course_activities web service.
 *
 * @package    editor_gutenberg
 * @copyright  2026 Aldrin Magno
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import { registerBlockType } from '@wordpress/blocks';

import edit from './edit';
import save from './save';
import './style.scss';

registerBlockType( 'moodle/activity-link', {
	title: 'Activity Link',
	description: 'Link to a Moodle activity in the current course.',
	category: 'widgets',
	icon: 'admin-links',
	keywords: [ 'activity', 'link', 'course', 'module' ],

	attributes: {
		cmid: {
			type: 'number',
			default: 0,
		},
		activityName: {
			type: 'string',
			default: '',
		},
		activityType: {
			type: 'string',
			default: '',
		},
		activityUrl: {
			type: 'string',
			default: '',
		},
		description: {
			type: 'string',
			default: '',
		},
		showDescription: {
			type: 'boolean',
			default: true,
		},
	},

	supports: {
		html: false,
		anchor: true,
	},

	edit,
	save,
} );
