/**
 * Activity Link block — Save component.
 *
 * Renders a styled link card as static HTML. The link points to
 * the Moodle activity's view page.
 *
 * @package    editor_gutenberg
 * @copyright  2026 Aldrin Magno
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import { useBlockProps } from '@wordpress/block-editor';

const MODULE_ICONS = {
	assign: '📝',
	quiz: '❓',
	forum: '💬',
	resource: '📄',
	url: '🔗',
	page: '📃',
	book: '📖',
	folder: '📁',
	label: '🏷️',
	choice: '☑️',
	feedback: '📊',
	glossary: '📚',
	wiki: '📝',
	workshop: '🔧',
	lesson: '📖',
	scorm: '📦',
	lti: '🔌',
	data: '🗃️',
	chat: '💬',
	survey: '📋',
	h5pactivity: '🎮',
};

export default function ActivityLinkSave( { attributes } ) {
	const { cmid, activityName, activityType, activityUrl, description, showDescription } = attributes;
	const blockProps = useBlockProps.save( { className: 'moodle-activity-link' } );

	if ( ! cmid || ! activityName ) {
		return null;
	}

	return (
		<div { ...blockProps }>
			<a
				href={ activityUrl }
				className="moodle-activity-link__card"
				data-cmid={ cmid }
				data-modname={ activityType }
			>
				<span className="moodle-activity-link__icon">
					{ MODULE_ICONS[ activityType ] || '📦' }
				</span>
				<span className="moodle-activity-link__content">
					<span className="moodle-activity-link__name">
						{ activityName }
					</span>
					<span className="moodle-activity-link__type">
						{ activityType }
					</span>
					{ showDescription && description && (
						<span className="moodle-activity-link__description">
							{ description }
						</span>
					) }
				</span>
			</a>
		</div>
	);
}
