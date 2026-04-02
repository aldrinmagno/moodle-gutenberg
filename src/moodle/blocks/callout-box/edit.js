/**
 * Callout Box block — Edit component.
 *
 * @package    editor_gutenberg
 * @copyright  2026 Aldrin Magno
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import { useBlockProps, RichText, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, SelectControl } from '@wordpress/components';

const CALLOUT_TYPES = [
	{ label: 'Info', value: 'info' },
	{ label: 'Warning', value: 'warning' },
	{ label: 'Success', value: 'success' },
	{ label: 'Danger', value: 'danger' },
];

const CALLOUT_ICONS = {
	info: 'ℹ️',
	warning: '⚠️',
	success: '✅',
	danger: '🚫',
};

export default function CalloutBoxEdit( { attributes, setAttributes } ) {
	const { type, title, body } = attributes;
	const blockProps = useBlockProps( {
		className: `moodle-callout moodle-callout--${ type }`,
	} );

	return (
		<>
			<InspectorControls>
				<PanelBody title="Callout Settings">
					<SelectControl
						label="Type"
						value={ type }
						options={ CALLOUT_TYPES }
						onChange={ ( value ) => setAttributes( { type: value } ) }
					/>
				</PanelBody>
			</InspectorControls>

			<div { ...blockProps }>
				<div className="moodle-callout__icon">
					{ CALLOUT_ICONS[ type ] || CALLOUT_ICONS.info }
				</div>
				<div className="moodle-callout__content">
					<RichText
						tagName="div"
						className="moodle-callout__title"
						placeholder="Callout title…"
						value={ title }
						onChange={ ( value ) => setAttributes( { title: value } ) }
						allowedFormats={ [ 'core/bold', 'core/italic' ] }
					/>
					<RichText
						tagName="div"
						className="moodle-callout__body"
						placeholder="Callout body text…"
						value={ body }
						onChange={ ( value ) => setAttributes( { body: value } ) }
					/>
				</div>
			</div>
		</>
	);
}
