/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2018, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

declare const openmct: MCT;

type OpenMCTPlugin = (openmct: MCT) => void;

declare class MCT {
    /**
     * Set path to where assets are hosted. This should be the path to main.js.
     */
    public setAssetPath(path: string): void;

    /**
     * Install a plugin in MCT.
     *
     * @param plugin a plugin install function which will be invoked with the mct instance.
     */
    public install(plugin: OpenMCTPlugin): void;

    /**
     * Start running Open MCT. This should be called only after any plugins have been installed.
     * @param domElement the DOM element in which to run MCT; if undefined, MCT will be run in the body of the document
     */
    public start(domElement?: HTMLElement): void;

    public plugins: typeof plugins;

    /**
     * MCT's time conductor, which may be used to synchronize view contents
     * for telemetry- or time-based views.
     */
    public time: api.TimeAPI;

    /**
     * An interface for interacting with the composition of domain objects.
     * The composition of a domain object is the list of other domain
     * objects it "contains" (for instance, that should be displayed
     * beneath it in the tree.)
     *
     * `composition` may be called as a function, in which case it acts
     * as `composition.get`.
     */
    public composition: api.CompositionAPI;

    /**
     * Registry for views of domain objects which should appear in the
     * main viewing area.
     */
    public objectViews: ViewRegistry;

    /**
     * Registry for views which should appear in the Inspector area.
     * These views will be chosen based on the selection state.
     */
    public inspectorViews: InspectorViewRegistry;

    /**
     * Registry for views which should appear in Edit Properties
     * dialogs, and similar user interface elements used for
     * modifying domain objects external to its regular views.
     */
    public propertyEditors: ViewRegistry;

    /**
     * Registry for views which should appear in the status indicator area.
     */
    // public indicators: ViewRegistry; FIXME: ? Overridden? Intentionally?

    /**
     * Registry for views which should appear in the toolbar area while
     * editing. These views will be chosen based on the selection state.
     */
    public toolbars: ToolbarRegistry;

    /**
     * Registry for domain object types which may exist within this
     * instance of Open MCT.
     */
    public types: api.TypeRegistry;

    /**
     * An interface for interacting with domain objects and the domain
     * object hierarchy.
     */
    public objects: api.ObjectAPI;

    /**
     * An interface for retrieving and interpreting telemetry data associated
     * with a domain object.
     */
    public telemetry: api.TelemetryAPI;

    /**
     * An interface for creating new indicators and changing them dynamically.
     */
    public indicators: api.IndicatorAPI;

    public notifications: api.NotificationAPI;

    public editor: api.EditorAPI;

    public overlays: OverlayAPI;

    public menus: api.MenuAPI;

    public actions: api.ActionsAPI;

    public status: api.StatusAPI;

    public router: ApplicationRouter;

    public branding: BrandingAPI;
}

declare module api {
    //#region TimeAPI
    /**
     * The public API for setting and querying the temporal state of the
     * application. The concept of time is integral to Open MCT, and at least
     * one {@link TimeSystem}, as well as some default time bounds must be
     * registered and enabled via {@link TimeAPI.addTimeSystem} and
     * {@link TimeAPI.timeSystem} respectively for Open MCT to work.
     *
     * Time-sensitive views will typically respond to changes to bounds or other
     * properties of the time conductor and update the data displayed based on
     * the temporal state of the application. The current time bounds are also
     * used in queries for historical data.
     *
     * The TimeAPI extends the EventEmitter class. A number of events are
     * fired when properties of the time conductor change, which are documented
     * below.
     */
    export class TimeAPI {
        /**
         * Register a new time system. Once registered it can activated using
         * {@link TimeAPI.timeSystem}, and can be referenced via its key in [Time Conductor configuration](@link https://github.com/nasa/openmct/blob/master/API.md#time-conductor).
         * @param {TimeSystem} timeSystem A time system object.
         */
        public addTimeSystem(timeSystem: TimeSystem): void;

        public getAllTimeSystems(): TimeSystem[];

        /**
         * Register a new Clock.
         */
        public addClock(clock: Clock): void;

        public getAllClocks(): Clock[];

        /**
         * Validate the given bounds. This can be used for pre-validation of bounds,
         * for example by views validating user inputs.
         * @param bounds The start and end time of the conductor.
         * @returns A validation error, or true if valid
         */
        public validateBounds(bounds: TimeBounds): string | true;

        /**
         * Validate the given offsets. This can be used for pre-validation of
         * offsets, for example by views validating user inputs.
         * @param offsets The start and end offsets from a 'now' value.
         * @returns A validation error, or true if valid
         */
        public validateOffsets(offsets: ClockOffsets): string | true;

        /**
         * Get or set the start and end time of the time conductor. Basic validation
         * of bounds is performed.
         *
         * @throws {Error} Validation error
         */
        public bounds(newBounds: TimeBounds): TimeBounds;

        /**
         * Get or set the time system of the TimeAPI.
         * 
         * @returns The currently applied time system
         */
        public timeSystem(timeSystemOrKey: TimeSystem | string, bounds: TimeBounds): TimeSystem;

        /**
         * Get or set the Time of Interest. The Time of Interest is a single point
         * in time, and constitutes the temporal focus of application views. It can
         * be manipulated by the user from the time conductor or from other views.
         * The time of interest can effectively be unset by assigning a value of
         * 'undefined'.
         * 
         * @returns the current time of interest
         */
        public timeOfInterest(newTOI?: number): number

        /**
         * Set the active clock. Tick source will be immediately subscribed to
         * and ticking will begin. Offsets from 'now' must also be provided. A clock
         * can be unset by calling {@link stopClock}.
         *
         * @param keyOrClock The clock to activate, or its key
         * @param offsets on each tick these will be used to calculate
         * the start and end bounds. This maintains a sliding time window of a fixed
         * width that automatically updates.
         * 
         * @return the currently active clock;
         */
        public clock(keyOrClock: Clock | string, offsets: ClockOffsets): Clock;

        /**
         * Get or set the currently applied clock offsets. If no parameter is provided,
         * the current value will be returned. If provided, the new value will be
         * used as the new clock offsets.
         */
        public clockOffsets(offsets: ClockOffsets): ClockOffsets;

        /**
         * Stop the currently active clock from ticking, and unset it. This will
         * revert all views to showing a static time frame defined by the current
         * bounds.
         */
        public stopClock(): void;
    }

    export interface TimeBounds {
        /**
         * The start time displayed by the time conductor in ms since epoch.
         * Epoch determined by currently active time system
         */
        start: number;
        /**
         * The end time displayed by the time conductor in ms since epoch.
         */
        end: number;
    }

    /**
     * Clock offsets are used to calculate temporal bounds when the system is
     * ticking on a clock source.
     */
    export interface ClockOffsets {
        /**
         * A time span relative to the current value of the ticking clock, from
         * which start bounds will be calculated. This value must be < 0. When
         * a clock is active, bounds will be calculated automatically based on
         * the value provided by the clock, and the defined clock offsets.
         */
        start: number;
        /**
         * A time span relative to the current value of the ticking clock, from
         * which end bounds will be calculated. This value must be >= 0.
         */
        end: number;
    }

    /**
     * A TimeSystem provides meaning to the values returned by the TimeAPI. Open
     * MCT supports multiple different types of time values, although all are
     * intrinsically represented by numbers, the meaning of those numbers can
     * differ depending on context.
     *
     * A default time system is provided by Open MCT in the form of the {@link UTCTimeSystem},
     * which represents integer values as ms in the Unix epoch. An example of
     * another time system might be "sols" for a Martian mission. TimeSystems do
     * not address the issue of converting between time systems.
     */
    export interface TimeSystem {
        /** A unique identifier */
        key: string;
        /** A human-readable descriptor */
        name: string;
        /**
         * Specify a css class defining an icon for this time system. This will
         * be visible next to the time system in the menu in the Time Conductor
         */
        cssClass?: string;
        /**
         * The key of a format to use when displaying discrete timestamps from
         * this time system
         */
        timeFormat: string;
        /**
         * The key of a format to use when displaying a duration or relative
         * span of time in this time system.
         */
        durationFormat?: string;
    }

    /**
     * Clocks provide a timing source that is used to
     * automatically update the time bounds of the data displayed in Open MCT.
     * @see {LocalClock}
     */
    export interface Clock {
        /** A unique identifier */
        key: string;
        /**
         * A human-readable name. The name will be used to represent this
         * clock in the Time Conductor UI
         */
        name: string;
        /**
         * A longer description, ideally identifying what the clock ticks
         * on.
         */
        description: string;
        /**
         * Returns the last value generated by a tick, or a default value
         * if no ticking has yet occurred
         */
        currentValue(): number;
    }
    //#endregion

    
}

declare module plugins {
    function UTCTimeSystem(): OpenMCTPlugin;

    function LocalTimeSystem(): OpenMCTPlugin;

    function ImportExport(): OpenMCTPlugin;

    /**
     * Static Root Plugin: takes an export file and exposes it as a new root
     * object.
     */
    function StaticRootPlugin(namespace: string, exportUrl: string): OpenMCTPlugin;

    /**
     * A tabular view showing the latest values of multiple telemetry points at
     * once. Formatted so that labels and values are aligned.
     *
     * @param {Object} [options] Optional settings to apply to the autoflow
     * tabular view. Currently supports one option, 'type'.
     * @param {string} [options.type] The key of an object type to apply this view
     * to exclusively.
     */
    function AutoflowView(options: { type: string }): OpenMCTPlugin;

    function Conductor(options: { menuOptions: { timeSystem: string, clock: string }[] }): OpenMCTPlugin;

    function CouchDB(options: { url?: string } | string): OpenMCTPlugin;

    function Elasticsearch(url: string): (openmct: MCT) => void;

    function Generator(): OpenMCTPlugin;

    function ExampleImagery(): OpenMCTPlugin;
    function ImageryPlugin(): OpenMCTPlugin;
    function Plot(): OpenMCTPlugin;
    function PlotVue(): OpenMCTPlugin;
    function TelemetryTable(): OpenMCTPlugin;

    function SummaryWidget(): OpenMCTPlugin;
    function TelemetryMean(): OpenMCTPlugin;
    function URLIndicator(opts: { url: string, label?: string, interval?: string, iconClass?: string }): OpenMCTPlugin;
    function Notebook(): OpenMCTPlugin;
    function DisplayLayout(options: { showAsView: string[] }): OpenMCTPlugin;
    function FolderView(): OpenMCTPlugin;
    function Tabs(): OpenMCTPlugin;
    function FlexibleLayout(): OpenMCTPlugin;
    function LADTable(): OpenMCTPlugin;
    function Filters(supportedObjectTypesArray: string[]): OpenMCTPlugin;
    function ObjectMigration(): OpenMCTPlugin;
    function GoToOriginalAction(): OpenMCTPlugin;
    function ClearData(appliesToObjects: string[], options?: { indicator: boolean }): OpenMCTPlugin;
    function WebPage(): OpenMCTPlugin;

    /** Theme */
    function Espresso(): OpenMCTPlugin;

    /** Theme */
    function Maelstrom(): OpenMCTPlugin;

    /** Theme */
    function Snow(): OpenMCTPlugin;

    function Condition(): OpenMCTPlugin;
    function ConditionWidget(): OpenMCTPlugin;
    function URLTimeSettingsSynchronizer(): OpenMCTPlugin;
    function NotificationIndicator(): OpenMCTPlugin;
    function NewFolderAction(): OpenMCTPlugin;
    function NonEditableFolder(): OpenMCTPlugin;
    function ISOTimeFormat(): OpenMCTPlugin;
    function DefaultRootName(name: string): OpenMCTPlugin;
    function PlanLayout(): OpenMCTPlugin;
    function ViewDatumAction(): OpenMCTPlugin;
    function ObjectInterceptors(): OpenMCTPlugin;
    function PerformanceIndicator(): OpenMCTPlugin;
    function CouchDBSearchFolder(folderName: string, couchPlugin: { couchProvider: unknown }, searchFilter: string): OpenMCTPlugin;
    function Timeline(): OpenMCTPlugin;

    // Legacy
    function LocalStorage(): OpenMCTPlugin;
    function MyItems(): OpenMCTPlugin;
    function Elasticsearch(): OpenMCTPlugin
}