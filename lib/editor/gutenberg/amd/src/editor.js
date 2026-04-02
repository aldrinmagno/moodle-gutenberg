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
 * Gutenberg editor AMD module for Moodle.
 *
 * This is the bridge between Moodle's AMD/RequireJS module system and the
 * webpack-bundled Isolated Block Editor. It loads the pre-built editor bundle
 * and mounts it onto Moodle textareas.
 *
 * @module     editor_gutenberg/editor
 * @copyright  2026 Aldrin Magno
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define(['editor_gutenberg/gutenberg-editor'], function(GutenbergEditor) {
    'use strict';

    /** @type {Map<HTMLTextAreaElement, Object>} */
    const instanceMap = new Map();

    /**
     * Default editor settings for the Moodle integration.
     *
     * @type {Object}
     */
    const defaultEditorSettings = {
        iso: {
            moreMenu: false,
            toolbar: {
                inserter: true,
                inspector: true,
                navigation: true,
                undo: true,
                selectorTool: true
            }
        }
    };

    /**
     * Set up the Gutenberg editor for a textarea identified by element ID.
     *
     * Follows the editor_tiny pattern for Moodle editor initialization.
     * Uses M.util.js_pending/js_complete for Behat test synchronization.
     *
     * @param {Object} config Configuration from PHP.
     * @param {string} config.elementId The ID of the textarea to replace.
     * @param {Object} [config.options] Editor options from Moodle.
     * @param {Object} [config.fpoptions] File picker options.
     */
    const setupForElementId = function(config) {
        const pendingKey = 'editor_gutenberg/editor:setupForElementId:' + config.elementId;
        M.util.js_pending(pendingKey);

        const textarea = document.getElementById(config.elementId);
        if (!textarea) {
            M.util.js_complete(pendingKey);
            return;
        }

        // Don't re-initialize if already attached.
        if (instanceMap.has(textarea)) {
            M.util.js_complete(pendingKey);
            return;
        }

        const instance = GutenbergEditor.attachEditor(textarea, defaultEditorSettings);
        instanceMap.set(textarea, instance);

        M.util.js_complete(pendingKey);
    };

    return {
        /**
         * Set up the editor for a specific textarea element.
         *
         * @param {Object} config Configuration object.
         * @param {string} config.elementId The textarea element ID.
         * @param {Object} [config.options] Editor options.
         * @param {Object} [config.fpoptions] File picker options.
         */
        setupForElementId: setupForElementId,

        /**
         * Initialise the editor. Called from PHP use_editor().
         *
         * @param {Object} config Configuration object.
         */
        init: function(config) {
            setupForElementId(config);
        },

        /**
         * Detach the editor from a textarea and restore it.
         *
         * @param {string} elementId The textarea element ID.
         */
        destroyForElementId: function(elementId) {
            const textarea = document.getElementById(elementId);
            if (!textarea || !instanceMap.has(textarea)) {
                return;
            }
            GutenbergEditor.detachEditor(textarea);
            instanceMap.delete(textarea);
        }
    };
});
