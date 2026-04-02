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
 * Text filter for Gutenberg block content.
 *
 * Applied during format_text() to clean up any remaining block
 * comment delimiters and ensure Gutenberg output renders properly.
 *
 * This filter is registered as a callback in the editor plugin,
 * not as a standalone filter plugin. It hooks into Moodle's
 * format_text() pipeline via the editor's content processing.
 *
 * @package    editor_gutenberg
 * @copyright  2026 Aldrin Magno
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace editor_gutenberg;

defined('MOODLE_INTERNAL') || die();

/**
 * Filter that strips Gutenberg block comments from display output.
 *
 * HTMLPurifier should already strip comments, but this provides a
 * belt-and-suspenders cleanup for contexts where purification is
 * disabled (e.g., trusted content, noclean=true).
 *
 * @package    editor_gutenberg
 * @copyright  2026 Aldrin Magno
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class text_filter extends \core_filters\text_filter {

    /**
     * Filter the text by removing Gutenberg block comment delimiters.
     *
     * Only processes content that contains block comments — skips
     * everything else for performance.
     *
     * @param string $text The text to filter.
     * @param array $options Filter options.
     * @return string The filtered text.
     */
    public function filter($text, array $options = []): string {
        // Quick check: skip if no block comments present.
        if (strpos($text, '<!-- wp:') === false) {
            return $text;
        }

        return content_processor::prepare_for_display($text);
    }
}
