/**
 * Callout Box block — Save component.
 *
 * Renders static HTML that works with Moodle's default themes.
 *
 * @package    editor_gutenberg
 * @copyright  2026 Aldrin Magno
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import { useBlockProps, RichText } from '@wordpress/block-editor';

const CALLOUT_ICONS = {
	info: 'ℹ️',
	warning: '⚠️',
	success: '✅',
	danger: '🚫',
};

export default function CalloutBoxSave( { attributes } ) {
	const { type, title, body } = attributes;
	const blockProps = useBlockProps.save( {
		className: `moodle-callout moodle-callout--${ type }`,
	} );

	return (
		<div { ...blockProps }>
			<div className="moodle-callout__icon">
				{ CALLOUT_ICONS[ type ] || CALLOUT_ICONS.info }
			</div>
			<div className="moodle-callout__content">
				{ title && (
					<RichText.Content
						tagName="div"
						className="moodle-callout__title"
						value={ title }
					/>
				) }
				{ body && (
					<RichText.Content
						tagName="div"
						className="moodle-callout__body"
						value={ body }
					/>
				) }
			</div>
		</div>
	);
}
