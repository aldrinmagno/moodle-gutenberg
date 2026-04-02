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
 * Gutenberg editor library.
 *
 * @package    editor_gutenberg
 * @copyright  2026 Aldrin Magno
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

class_alias(\editor_gutenberg\editor::class, 'gutenberg_texteditor');

/**
 * Serve plugin CSS files.
 *
 * Required for Moodle's pluginfile.php to serve the editor's CSS.
 *
 * @param stdClass $course Course object.
 * @param stdClass $cm Course module object.
 * @param context $context Context object.
 * @param string $filearea File area.
 * @param array $args File path arguments.
 * @param bool $forcedownload Force download.
 * @param array $options Additional options.
 * @return bool False if file not found.
 */
function editor_gutenberg_pluginfile($course, $cm, $context, $filearea, $args, $forcedownload, array $options = []) {
    return false;
}

/**
 * Get the content processor instance.
 *
 * Convenience function for other plugins that need to process
 * Gutenberg content (e.g. for migration or bulk operations).
 *
 * @return \editor_gutenberg\content_processor
 */
function editor_gutenberg_get_content_processor(): \editor_gutenberg\content_processor {
    return new \editor_gutenberg\content_processor();
}
