use const_format::concatcp;
use derive_builder::Builder;
use serde::{Deserialize, Serialize};

/// Uniquely identifies a domain object.
#[derive(Debug, Serialize, Deserialize, Eq, PartialEq)]
pub struct Identifier<'a> {
    /// the namespace to/from which this domain object should be loaded/stored.
    pub namespace: &'a str,
    /// a unique identifier for the domain object within that namespace
    pub key: &'a str,
}

impl<'a> Identifier<'a> {
    pub const NAMESPACE: &'static str = "dusterthefirst.pico-pilot";

    pub const fn from_key(key: &'a str) -> Identifier {
        Identifier {
            namespace: Self::NAMESPACE,
            key,
        }
    }
}

/// A domain object is an entity of relevance to a user's workflow, that
/// should appear as a distinct and meaningful object within the user
/// interface. Examples of domain objects are folders, telemetry sensors,
/// and so forth.
///
/// A few common properties are defined for domain objects. Beyond these,
/// individual types of domain objects may add more as they see fit.
#[derive(Debug, Serialize)]
pub struct DomainObject<'a> {
    /// a key/namespace pair which uniquely identifies this domain object
    identifier: Identifier<'a>,
    /// the type of domain object
    #[serde(rename = "type")]
    ty: &'a str,
    /// the human-readable name for this domain object
    name: &'a str,
    /// the user name of the creator of this domain object
    creator: Option<&'a str>,
    location: &'a str,

    /// the time, in milliseconds since the UNIX epoch, at which this domain
    /// object was last modified
    modified: Option<u64>,
    /// if present, this will be used by the default composition provider to
    /// load domain objects
    composition: Option<&'a [Identifier<'a>]>,
    telemetry: Option<DomainObjectTelemetry<'a>>,
}

#[derive(Debug, Serialize)]
pub struct DomainObjectTelemetry<'a> {
    values: Vec<ValueMetadata<'a>>,
}

impl<'a> DomainObjectTelemetry<'a> {
    pub const fn new(meta: Vec<ValueMetadata<'a>>) -> Self {
        DomainObjectTelemetry { values: meta }
    }
}

/// See [https://github.com/nasa/openmct/blob/master/API.md#telemetry-api]
#[derive(Serialize, Debug, Clone, Builder, Default)]
#[serde(rename_all = "camelCase")]
#[builder(setter(strip_option), default)]
pub struct ValueMetadata<'s> {
    /// unique identifier for this field.
    key: &'s str,
    /// Hints allow views to intelligently select relevant attributes for display, and are required
    /// for most views to function. See section on "Value Hints" below.
    hints: ValueHint,
    /// a human readable label for this field. If omitted, defaults to `key`.
    name: Option<&'s str>,
    /// identifies the property of a datum where this value is stored. If omitted, defaults to `key`.
    source: Option<&'s str>,
    /// a specific format identifier, mapping to a formatter. If omitted, uses a default formatter.
    /// For enumerations, use `enum`. For timestamps, use `utc` if you are using utc dates, otherwise use
    /// a key mapping to your custom date format.
    format: Option<&'s str>,
    /// the units of this value, e.g. `km`, `seconds`, `parsecs`
    units: Option<&'s str>,
    /// the minimum possible value of this measurement. Will be used by plots, gauges, etc to
    /// automatically set a min value.
    min: Option<f64>,
    /// the maximum possible value of this measurement. Will be used by plots, gauges, etc to
    /// automatically set a max value.
    max: Option<f64>,
    /// for objects where `format` is `"enum"`, this array tracks all possible enumerations of the value.
    /// Each entry in this array is an object, with a `value` property that is the numerical value of
    /// the enumeration, and a `string` property that is the text value of the enumeration.
    /// ex: `{"value": 0, "string": "OFF"}`. If you use an enumerations array, `min` and `max` will be set
    /// automatically for you.
    enumerations: Option<&'s [TelemetryEnumeration<'s>]>,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct TelemetryEnumeration<'s> {
    value: u32,
    string: &'s str,
}

/// Each telemetry value description has an object defining hints. Keys in this this object represent
/// the hint itself, and the value represents the weight of that hint. A lower weight means the hint
/// has a higher priority. For example, multiple values could be hinted for use as the y-axis of a plot
/// (raw, engineering), but the highest priority would be the default choice. Likewise, a table will
/// use hints to determine the default order of columns.
#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
#[serde(rename_all = "camelCase")]
pub enum ValueHint {
    Domain(u32),
    Range(u32),
    Image(u32),
}

impl Default for ValueHint {
    fn default() -> Self {
        Self::Range(1)
    }
}

const TELEMETRY_TYPE: &'static str = concatcp!(Identifier::NAMESPACE, ".telemetry");

lazy_static::lazy_static! {
    pub static ref TELEMETRY_VALUES: Vec<DomainObject<'static>> = vec![DomainObject {
        telemetry: Some(DomainObjectTelemetry::new(vec![
            ValueMetadataBuilder::default()
                .format("float")
                .key("tvc_x")
                .name("TVC X Axis")
                .units("degrees")
                .build()
                .unwrap(),
            ValueMetadataBuilder::default()
                .format("float")
                .key("tvc_z")
                .name("TVC Z Axis")
                .units("degrees")
                .build()
                .unwrap(),
            ValueMetadataBuilder::default()
                .format("float")
                .key("angle")
                .name("TVC Angle [debug]")
                .units("radians")
                .build()
                .unwrap(),
            ValueMetadataBuilder::default()
                .format("float")
                .key("temperature")
                .name("Processor Temperature")
                .units("celsius")
                .build()
                .unwrap(),
            ValueMetadataBuilder::default()
                .format("float")
                .key("v_sys")
                .name("System Bus")
                .units("volt")
                .build()
                .unwrap(),
            ValueMetadataBuilder::default()
                .format("float")
                .key("v_bat")
                .name("Battery")
                .units("volt")
                .build()
                .unwrap(),
            ValueMetadataBuilder::default()
                .key("offset")
                .name("ADC Offset")
                .build()
                .unwrap(),
            ValueMetadataBuilder::default()
                .format("local-format")
                .hints(ValueHint::Domain(1))
                .key("local")
                .source("running_us")
                .name("Timestamp")
                .build()
                .unwrap(),
        ])),
        composition: None,
        creator: None,
        identifier: Identifier::from_key("test"),
        location: concatcp!(Identifier::NAMESPACE, ":avionics"),
        modified: None,
        ty: TELEMETRY_TYPE,
        name: "Test",
    }];
}

pub fn get_telemetry_composition() -> Vec<&'static Identifier<'static>> {
    TELEMETRY_VALUES
        .iter()
        .map(|DomainObject { identifier, .. }| identifier)
        .collect()
}

pub fn get_telemetry_metadata(identifier: Identifier) -> Option<&DomainObject<'static>> {
    TELEMETRY_VALUES
        .iter()
        .find(|object| object.identifier == identifier)
}
