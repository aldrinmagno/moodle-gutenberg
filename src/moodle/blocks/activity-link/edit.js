/**
 * Activity Link block — Edit component.
 *
 * Fetches activities from the Moodle web service and lets the user
 * pick one to create a styled link card.
 *
 * @package    editor_gutenberg
 * @copyright  2026 Aldrin Magno
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import { useState, useEffect } from '@wordpress/element';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, ToggleControl, Placeholder, Spinner, ComboboxControl } from '@wordpress/components';

/**
 * Module type icons — maps Moodle module names to display icons.
 */
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

/**
 * Fetch course activities from the Moodle web service.
 *
 * @param {number} courseId - The course ID.
 * @return {Promise<Array>} Array of activity objects.
 */
async function fetchCourseActivities( courseId ) {
	// Build the web service URL using Moodle's global config.
	const sesskey = window.M && window.M.cfg && window.M.cfg.sesskey;
	const wwwroot = window.M && window.M.cfg && window.M.cfg.wwwroot;

	if ( ! sesskey || ! wwwroot ) {
		throw new Error( 'Moodle configuration not available.' );
	}

	const params = new URLSearchParams( {
		sesskey,
		info: 'editor_gutenberg_get_course_activities',
		'args[0][index]': '0',
		'args[0][methodname]': 'editor_gutenberg_get_course_activities',
		'args[0][args][courseid]': String( courseId ),
	} );

	const response = await fetch( `${ wwwroot }/lib/ajax/service.php?${ params.toString() }` );

	if ( ! response.ok ) {
		throw new Error( `HTTP ${ response.status }` );
	}

	const data = await response.json();

	// Moodle returns an array of results; the first one is our call.
	if ( Array.isArray( data ) && data[ 0 ] && ! data[ 0 ].error ) {
		return data[ 0 ].data || [];
	}

	if ( Array.isArray( data ) && data[ 0 ] && data[ 0 ].error ) {
		throw new Error( data[ 0 ].exception?.message || 'Web service error' );
	}

	return [];
}

/**
 * Get the current course ID from the Moodle page context.
 *
 * @return {number} The course ID, or 0 if not found.
 */
function getCourseId() {
	// Try the body data attribute (Boost theme).
	const bodyDataset = document.body.dataset;
	if ( bodyDataset && bodyDataset.courseId ) {
		return parseInt( bodyDataset.courseId, 10 );
	}

	// Try M.cfg.courseId (set by some Moodle pages).
	if ( window.M && window.M.cfg && window.M.cfg.courseId ) {
		return parseInt( window.M.cfg.courseId, 10 );
	}

	// Fallback: parse from URL.
	const match = window.location.search.match( /[?&]course=(\d+)/ );
	if ( match ) {
		return parseInt( match[ 1 ], 10 );
	}

	return 0;
}

export default function ActivityLinkEdit( { attributes, setAttributes } ) {
	const { cmid, activityName, activityType, description, showDescription } = attributes;
	const blockProps = useBlockProps( { className: 'moodle-activity-link' } );

	const [ activities, setActivities ] = useState( [] );
	const [ loading, setLoading ] = useState( false );
	const [ error, setError ] = useState( null );

	// Fetch activities on mount.
	useEffect( () => {
		const courseId = getCourseId();
		if ( ! courseId ) {
			setError( 'Could not determine course ID. Save this page first and reload.' );
			return;
		}

		setLoading( true );
		fetchCourseActivities( courseId )
			.then( ( result ) => {
				setActivities( result );
				setLoading( false );
			} )
			.catch( ( err ) => {
				setError( err.message );
				setLoading( false );
			} );
	}, [] );

	// Build options for the ComboboxControl.
	const activityOptions = activities.map( ( activity ) => ( {
		value: String( activity.cmid ),
		label: `${ MODULE_ICONS[ activity.modname ] || '📦' } ${ activity.name } (${ activity.modname })`,
	} ) );

	/**
	 * Handle activity selection.
	 *
	 * @param {string} value - The selected cmid as string.
	 */
	function onSelectActivity( value ) {
		const selected = activities.find( ( a ) => String( a.cmid ) === value );
		if ( selected ) {
			setAttributes( {
				cmid: selected.cmid,
				activityName: selected.name,
				activityType: selected.modname,
				activityUrl: selected.url,
				description: selected.description || '',
			} );
		}
	}

	// Show the selected activity card, or a picker if none selected.
	const hasSelection = cmid > 0 && activityName;

	return (
		<>
			<InspectorControls>
				<PanelBody title="Activity Link Settings">
					<ToggleControl
						label="Show description"
						checked={ showDescription }
						onChange={ ( value ) => setAttributes( { showDescription: value } ) }
					/>
					{ activities.length > 0 && (
						<ComboboxControl
							label="Change activity"
							value={ String( cmid ) }
							options={ activityOptions }
							onChange={ onSelectActivity }
						/>
					) }
				</PanelBody>
			</InspectorControls>

			<div { ...blockProps }>
				{ ! hasSelection ? (
					<Placeholder
						icon="admin-links"
						label="Activity Link"
						instructions={
							error
								? `Error: ${ error }`
								: loading
								? 'Loading course activities…'
								: 'Select an activity from this course.'
						}
					>
						{ loading && <Spinner /> }
						{ ! loading && ! error && activities.length > 0 && (
							<ComboboxControl
								value={ String( cmid ) }
								options={ activityOptions }
								onChange={ onSelectActivity }
								placeholder="Search activities…"
							/>
						) }
						{ ! loading && ! error && activities.length === 0 && (
							<p>No activities found in this course.</p>
						) }
					</Placeholder>
				) : (
					<div className="moodle-activity-link__card">
						<div className="moodle-activity-link__icon">
							{ MODULE_ICONS[ activityType ] || '📦' }
						</div>
						<div className="moodle-activity-link__content">
							<div className="moodle-activity-link__name">
								{ activityName }
							</div>
							<div className="moodle-activity-link__type">
								{ activityType }
							</div>
							{ showDescription && description && (
								<div className="moodle-activity-link__description">
									{ description }
								</div>
							) }
						</div>
					</div>
				) }
			</div>
		</>
	);
}
