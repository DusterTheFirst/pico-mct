/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2020, United States Government
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

    //#region CompositionAPI
    export class CompositionAPI {
        /**
         * An interface for interacting with the composition of domain objects.
         * The composition of a domain object is the list of other domain objects
         * it "contains" (for instance, that should be displayed beneath it
         * in the tree.)
         */
        constructor(openmct: MCT);

        /**
         * Add a composition provider.
         *
         * Plugins can add new composition providers to change the loading
         * behavior for certain domain objects.
         *
         * @param provider the provider to add
         */
        public addProvider(provider: CompositionProvider): void;

        /**
         * Retrieve the composition (if any) of this domain object.
         */
        public get(domainObject: DomainObject): CompositionCollection;


        /**
         * Add a composition policy. Composition policies may disallow domain
         * objects from containing other domain objects.
         */
        public addPolicy(policy: CompositionPolicy): void;
    }

    /**
     * A composition policy is a function which either allows or disallows
     * placing one object in another's composition.
     *
     * Open MCT's policy model requires consensus, so any one policy may
     * reject composition by returning false. As such, policies should
     * generally be written to return true in the default case.
     *
     * @param containingObject the object which
     *        would act as a container
     * @param containedObject the object which
     *        would be contained
     * @returns false if this composition should be disallowed
     */
    export type CompositionPolicy = (containingObject: DomainObject, containedObject: DomainObject) => boolean;

    /**
     * A CompositionCollection represents the list of domain objects contained
     * by another domain object. It provides methods for loading this
     * list asynchronously, modifying this list, and listening for changes to
     * this list.
     *
     * Usage:
     * ```javascript
     *  var myViewComposition = MCT.composition.get(myViewObject);
     *  myViewComposition.on('add', addObjectToView);
     *  myViewComposition.on('remove', removeObjectFromView);
     *  myViewComposition.load(); // will trigger `add` for all loaded objects.
     *  ```
     *
     * @param domainObject the domain object whose composition will be contained
     * @param provider the provider to use to retrieve other domain objects
     * @param api the composition API, for policy checks
     */
    export class CompositionCollection {
        constructor(domainObject: DomainObject, provider: CompositionProvider, api: CompositionAPI);

        /**
         * Listen for changes to this composition.  Supports 'add', 'remove', and
         * 'load' events.
         *
         * @param event event to listen for, either 'add', 'remove' or 'load'.
         * @param callback to trigger when event occurs.
         * @param [context] context to use when invoking callback, optional.
         */
        public on<T>(event: "add" | "remove" | "reorder", callback: (context: T) => void, context?: T): void;

        /**
         * Remove a listener.  Must be called with same exact parameters as
         * `on`.
         *
         * @param event
         * @param callback
         * @param [context]
         */
        public off<T>(event: "add" | "remove" | "reorder", callback: (context: T) => void, context?: T): void;

        /**
         * Add a domain object to this composition.
         *
         * A call to [load]{@link module:openmct.CompositionCollection#load}
         * must have resolved before using this method.
         *
         * @param child the domain object to add
         * @param skipMutate true if the underlying provider should
         *        not be updated
         */
        public add(child: DomainObject, skipMutate: boolean): void;

        /**
         * Load the domain objects in this composition.
         *
         * @returns  a promise for
         *          the domain objects in this composition
         */
        public load(): Promise<DomainObject[]>;

        /**
         * Remove a domain object from this composition.
         *
         * A call to [load]{@link module:openmct.CompositionCollection#load}
         * must have resolved before using this method.
         *
         * @param child the domain object to remove
         * @param skipMutate true if the underlying provider should
         *        not be updated
         */
        public remove(child: DomainObject, skipMutate: boolean): void;

        /**
         * Reorder the domain objects in this composition.
         *
         * A call to [load]{@link module:openmct.CompositionCollection#load}
         * must have resolved before using this method.
         *
         * @param oldIndex
         * @param newIndex
         */
        public reorder(oldIndex: number, newIndex: number): void;

        public cleanUpMutables(): void;
    }

    /**
     * A CompositionProvider provides the underlying implementation of
     * composition-related behavior for certain types of domain object.
     *
     * By default, a composition provider will not support composition
     * modification.  You can add support for mutation of composition by
     * defining `add` and/or `remove` methods.
     *
     * If the composition of an object can change over time-- perhaps via
     * server updates or mutation via the add/remove methods, then one must
     * trigger events as necessary.
     */
    export class CompositionProvider {
        constructor(publicAPI: MCT, compositionAPI: CompositionAPI);

        /**
         * Check if this provider should be used to load composition for a
         * particular domain object.
         * @param domainObject the domain object to check
         * @returns true if this provider can provide composition for a given
         * domain object
         */
        public appliesTo(domainObject: DomainObject): boolean;

        /**
         * Load any domain objects contained in the composition of this domain
         * object.
         * @param domainObject the domain object for which to load composition
         * @returns a promise for the Identifiers in this composition
         */
        public load(domainObject: DomainObject): Promise<Identifier[]>;

        /**
         * Attach listeners for changes to the composition of a given domain object.
         * Supports `add` and `remove` events.
         *
         * @param domainObject to listen to
         * @param event the event to bind to, either `add` or `remove`.
         * @param callback callback to invoke when event is triggered.
         * @param [context] context to use when invoking callback.
         */
        public on<T>(domainObject: DomainObject, event: "add" | "remove", callback: (context: T, event: any) => void, context?: T): void;

        /**
         * Remove a listener that was previously added for a given domain object.
         * event name, callback, and context must be the same as when the listener
         * was originally attached.
         *
         * @param domainObject to remove listener for
         * @param event event to stop listening to: `add` or `remove`.
         * @param callback callback to remove.
         * @param [context] context of callback to remove.
         */
        public off<T>(domainObject: DomainObject, event: "add" | "remove", callback: (context: T, event: any) => void, context?: T): void;

        /**
         * Remove a domain object from another domain object's composition.
         *
         * This method is optional; if not present, adding to a domain object's
         * composition using this provider will be disallowed.
         *
         * @param domainObject the domain object which should have its composition modified
         * @param child the domain object to remove
         */
        public remove(domainObject: DomainObject, child: DomainObject): void;

        /**
         * Add a domain object to another domain object's composition.
         *
         * This method is optional; if not present, adding to a domain object's
         * composition using this provider will be disallowed.
         *
         * @param domainObject the domain object which should have its composition modified
         * @param child the domain object to add
         */
        public add(domainObject: DomainObject, child: DomainObject): void;

        public reorder(domainObject: DomainObject, oldIndex: number, newIndex: number): void;
    }
    //#endregion

    //#region ObjectAPI
    /**
     * Utilities for loading, saving, and manipulating domain objects.
     * @interface ObjectAPI
     * @memberof module:openmct
     */
    export class ObjectAPI {
        /**
         * Get the root-level object.
         * @returns a promise for the root object
         */
        public getRoot(): Promise<DomainObject>;

        /**
         * Register a new object provider for a particular namespace.
         *
         * @param namespace the namespace for which to provide objects
         * @param provider the provider which will handle loading domain objects
         * from this namespace
         */
        public addProvider(namespace: string, provider: Partial<ObjectProvider>): void;

        /**
         * Get a domain object.
         *
         * @param key the key for the domain object to load
         * @param abortSignal (optional) signal to abort fetch requests
         * @returns a promise which will resolve when the domain object
         *          has been saved, or be rejected if it cannot be saved
         */
        public get(key: string, abortSignal: AbortSignal): Promise<void>;

        /**
         * Search for domain objects.
         *
         * Object providersSearches and combines results of each object provider search.
         * Objects without search provided will have been indexed
         * and will be searched using the fallback indexed search.
         * Search results are asynchronous and resolve in parallel.
         *
         * @param query the term to search for
         * @param abortSignal (optional) signal to cancel downstream fetch requests
         * @returns an array of promises returned from each object provider's search function
         *          each resolving to domain objects matching provided search query and options.
         */
        public search(query: string, abortSignal: AbortSignal): Array<Promise<DomainObject>>;

        /**
         * Will fetch object for the given identifier, returning a version of the object that will automatically keep
         * itself updated as it is mutated. Before using this function, you should ask yourself whether you really need it.
         * The platform will provide mutable objects to views automatically if the underlying object can be mutated. The
         * platform will manage the lifecycle of any mutable objects that it provides. If you use `getMutable` you are
         * committing to managing that lifecycle yourself. `.destroy` should be called when the object is no longer needed.
         *
         * @returns a promise that will resolve with a MutableDomainObject if
         * the object can be mutated.
         */
        public getMutable(identifier: string): Promise<MutableDomainObject>;

        /**
         * This function is for cleaning up a mutable domain object when you're done with it.
         * You only need to use this if you retrieved the object using `getMutable()`. If the object was provided by the
         * platform (eg. passed into a `view()` function) then the platform is responsible for its lifecycle.
         */
        public destroyMutable(domainObject: MutableDomainObject): void;

        public delete(): void;

        public isPersistable(idOrKeyString: string): boolean;

        /**
         * Add a root-level object.
         * @param key an array of identifiers for root level objects, or a function
         * that returns a promise for an identifier or an array of root level objects.
         */
        public addRoot(key: Identifier[] | (() => Promise<Identifier[]>)): void;

        /**
         * Register an object interceptor that transforms a domain object requested via module:openmct.ObjectAPI.get
         * The domain object will be transformed after it is retrieved from the persistence store
         * The domain object will be transformed only if the interceptor is applicable to that domain object as defined by the InterceptorDef
         *
         * @param interceptorDef the interceptor definition to add
         */
        public addGetInterceptor(interceptorDef: InterceptorDef): void;

        /**
         * Modify a domain object.
         * @param object the object to mutate
         * @param path the property to modify
         * @param value the new value for this property
         */
        public mutate<T>(domainObject: DomainObject, path: string, value: T): void;

        /**
         * @param identifier An object identifier
         * @returns true if the object can be mutated, otherwise returns false
         */
        public supportsMutation(identifier: Identifier): boolean;

        /**
         * Observe changes to a domain object.
         * @param domainObject the object to observe
         * @param path the property to observe
         * @param callback a callback to invoke when new values for
         *        this property are observed
         */
        public observe(domainObject: DomainObject, path: string, callback: (domainObject: DomainObject) => void): void;

        /**
         * @returns A string representation of the given identifier, including namespace and key
         */
        public makeKeyString(identifier: Identifier): string;

        /**
         * @param keyString A string representation of the given identifier, that is, a namespace and key separated by a colon.
         * @returns An identifier object
         */
        public parseKeyString(keyString: string): Identifier;

        /**
         * Given any number of identifiers, will return true if they are all equal, otherwise false.
         */
        public areIdsEqual(...identifiers: Identifier[]): boolean;

        public getOriginalPath(identifier: Identifier, path?: DomainObject[]): DomainObject[];
    }

    /**
     * Provides the ability to read, write, and delete domain objects.
     *
     * When registering a new object provider, all methods on this interface
     * are optional.
     */
    export interface ObjectProvider {
        /**
         * Create the given domain object in the corresponding persistence store
         * 
         * @param domainObject the domain object to create
         * @returns a promise which will resolve when the domain object
         *          has been created, or be rejected if it cannot be saved
         */
        create(domainObject: DomainObject): Promise<void>;

        /**
         * Update this domain object in its persistence store
         *
         * @param domainObject the domain object to update
         * @returns  a promise which will resolve when the domain object
         *          has been updated, or be rejected if it cannot be saved
         */
        update(domainObject: DomainObject): Promise<void>;

        /**
         * Delete this domain object.
         *
         * @param domainObject the domain object to delete
         * @returns  a promise which will resolve when the domain object
         *          has been deleted, or be rejected if it cannot be deleted
         */
        delete(domainObject: DomainObject): Promise<void>;
    }

    /**
     * Uniquely identifies a domain object.
     */
    export interface Identifier {
        /** the namespace to/from which this domain object should be loaded/stored. */
        namespace: string,
        /** a unique identifier for the domain object within that namespace */
        key: string;
    }

    /**
     * A domain object is an entity of relevance to a user's workflow, that
     * should appear as a distinct and meaningful object within the user
     * interface. Examples of domain objects are folders, telemetry sensors,
     * and so forth.
     *
     * A few common properties are defined for domain objects. Beyond these,
     * individual types of domain objects may add more as they see fit.
     */
    export interface DomainObject {
        /** a key/namespace pair which uniquely identifies this domain object */
        identifier: Identifier,
        /** the type of domain object */
        type: string,
        /** the human-readable name for this domain object */
        name: string,
        /** the user name of the creator of this domain object */
        creator?: string,
        /**
         * the time, in milliseconds since the UNIX epoch, at which this domain
         * object was last modified
         */
        modified?: number,
        /**
         * if present, this will be used by the default composition provider to
         * load domain objects
         */
        composition?: Identifier[]
    }

    /**
     * Wraps a domain object to keep its model synchronized with other instances of the same object.
     *
     * Creating a MutableDomainObject will automatically register listeners to keep its model in sync. As such, developers
     * should be careful to destroy MutableDomainObject in order to avoid memory leaks.
     *
     * All Open MCT API functions that provide objects will provide MutableDomainObjects where possible, except
     * `openmct.objects.get()`, and will manage that object's lifecycle for you. Calling `openmct.objects.getMutable()`
     * will result in the creation of a new MutableDomainObject and you will be responsible for destroying it
     * (via openmct.objects.destroy) when you're done with it.
     */
    export class MutableDomainObject implements DomainObject {
        public identifier: Identifier;
        public type: string;
        public name: string;
        public creator?: string | undefined;
        public modified?: number | undefined;
        public composition?: Identifier[] | undefined;
        
        public static createMutable(object: DomainObject, mutationTopic: string): MutableDomainObject;
        public static mutateObject<T>(object: DomainObject, path: string, value: T): void;

        public $observe(path: string, callback: Function): Function;
        public $set<T>(path: string, value: T): void;
    
        public $refresh(model: string): void;
    
        public $on(event: string, callback: Function): Function;
        public $destroy(): void;
    }

    /**
     * A InterceptorRegistry maintains the definitions for different interceptors that may be invoked on domain objects.
     */
    export class InterceptorRegistry {
        /**
         * Register a new object interceptor.
         *
         * @param interceptorDef the interceptor to add
         */
        public addInterceptor(interceptorDef: InterceptorDef): void;

        /**
         * Retrieve all interceptors applicable to a domain object.
         * 
         * @returns the registered interceptors for this identifier/object
         */
        public getInterceptors(identifier: Identifier, object: Object): InterceptorDef;
    }

    export interface InterceptorDef {
        /** function that determines if this interceptor should be called for the given identifier/object */
        appliesTo(domainObject: DomainObject): boolean;
        /** function that transforms the provided domain object and returns the transformed domain object */
        invoke(domainObject: DomainObject): DomainObject;
        /** the priority for this interceptor. A higher number returned has more weight than a lower number */
        priority(domainObject: DomainObject): number;
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