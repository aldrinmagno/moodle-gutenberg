<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * External function to get course activities for the Activity Link block.
 *
 * Returns a list of all visible activities in the given course,
 * suitable for the Gutenberg Activity Link block picker.
 *
 * @package    editor_gutenberg
 * @copyright  2026 Aldrin Magno
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace editor_gutenberg\external;

defined('MOODLE_INTERNAL') || die();

require_once("$CFG->libdir/externallib.php");

use external_api;
use external_function_parameters;
use external_value;
use external_single_structure;
use external_multiple_structure;

/**
 * External function: get_course_activities.
 *
 * @package    editor_gutenberg
 * @copyright  2026 Aldrin Magno
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class get_course_activities extends external_api {

    /**
     * Describe the parameters for get_course_activities.
     *
     * @return external_function_parameters
     */
    public static function execute_parameters(): external_function_parameters {
        return new external_function_parameters([
            'courseid' => new external_value(PARAM_INT, 'The course ID'),
        ]);
    }

    /**
     * Get all visible activities in a course.
     *
     * @param int $courseid The course ID.
     * @return array List of activity objects.
     */
    public static function execute(int $courseid): array {
        global $DB;

        // Parameter validation.
        $params = self::validate_parameters(self::execute_parameters(), [
            'courseid' => $courseid,
        ]);
        $courseid = $params['courseid'];

        // Context validation — user must be able to view the course.
        $context = \context_course::instance($courseid);
        self::validate_context($context);
        require_capability('moodle/course:view', $context);

        // Get the course module info.
        $modinfo = get_fast_modinfo($courseid);
        $activities = [];

        foreach ($modinfo->get_cms() as $cm) {
            // Skip hidden modules and labels.
            if (!$cm->uservisible) {
                continue;
            }

            $activities[] = [
                'cmid' => $cm->id,
                'name' => format_string($cm->name, true, ['context' => $cm->context]),
                'modname' => $cm->modname,
                'url' => $cm->url ? $cm->url->out(false) : '',
                'description' => $cm->content ? format_text(
                    $cm->content,
                    FORMAT_HTML,
                    ['context' => $cm->context, 'noclean' => false]
                ) : '',
                'sectionnum' => $cm->sectionnum,
                'visible' => $cm->visible ? 1 : 0,
            ];
        }

        return $activities;
    }

    /**
     * Describe the return value for get_course_activities.
     *
     * @return external_multiple_structure
     */
    public static function execute_returns(): external_multiple_structure {
        return new external_multiple_structure(
            new external_single_structure([
                'cmid' => new external_value(PARAM_INT, 'Course module ID'),
                'name' => new external_value(PARAM_TEXT, 'Activity name'),
                'modname' => new external_value(PARAM_ALPHANUMEXT, 'Module type name'),
                'url' => new external_value(PARAM_URL, 'Activity URL'),
                'description' => new external_value(PARAM_RAW, 'Activity description HTML'),
                'sectionnum' => new external_value(PARAM_INT, 'Section number'),
                'visible' => new external_value(PARAM_INT, 'Visibility (1=visible, 0=hidden)'),
            ])
        );
    }
}
