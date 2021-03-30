use serde::{Deserialize, Serialize};

/// See [https://github.com/nasa/openmct/blob/master/API.md#telemetry-api]
#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct TelemetryValue<'s> {
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
    min: Option<u32>,
    /// the maximum possible value of this measurement. Will be used by plots, gauges, etc to
    /// automatically set a max value.
    max: Option<u32>,
    /// for objects where `format` is `"enum"`, this array tracks all possible enumerations of the value.
    /// Each entry in this array is an object, with a `value` property that is the numerical value of
    /// the enumeration, and a `string` property that is the text value of the enumeration.
    /// ex: `{"value": 0, "string": "OFF"}`. If you use an enumerations array, `min` and `max` will be set
    /// automatically for you.
    enumerations: Option<Vec<TelemetryEnumeration<'s>>>,
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
#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub enum ValueHint {
    Domain(u32),
    Range(u32),
    Image(u32)
}

pub fn get_telemetry_values() -> Vec<TelemetryValue<'static>> {
    todo!();
}