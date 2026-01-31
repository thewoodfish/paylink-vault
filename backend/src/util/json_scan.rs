use serde_json::Value;
use uuid::Uuid;

pub fn scan_base58_strings(value: &Value) -> Vec<String> {
    let mut out = Vec::new();
    scan_value(value, &mut out);
    out
}

fn scan_value(value: &Value, out: &mut Vec<String>) {
    match value {
        Value::String(s) => {
            if is_base58_signature(s) {
                out.push(s.to_string());
            }
        }
        Value::Array(arr) => {
            for v in arr {
                scan_value(v, out);
            }
        }
        Value::Object(map) => {
            for v in map.values() {
                scan_value(v, out);
            }
        }
        _ => {}
    }
}

fn is_base58_signature(s: &str) -> bool {
    let len = s.len();
    if len < 43 || len > 88 {
        return false;
    }
    s.chars().all(|c| matches!(c,
        '1'|'2'|'3'|'4'|'5'|'6'|'7'|'8'|'9'|
        'A'|'B'|'C'|'D'|'E'|'F'|'G'|'H'|'J'|'K'|'L'|'M'|'N'|'P'|'Q'|'R'|'S'|'T'|'U'|'V'|'W'|'X'|'Y'|'Z'|
        'a'|'b'|'c'|'d'|'e'|'f'|'g'|'h'|'i'|'j'|'k'|'m'|'n'|'o'|'p'|'q'|'r'|'s'|'t'|'u'|'v'|'w'|'x'|'y'|'z'
    ))
}

pub fn extract_paylink_id_from_memo(memo: &str) -> Option<Uuid> {
    let lowered = memo.to_lowercase();
    let candidates = ["paylink:", "paylink="];
    for prefix in candidates {
        if let Some(idx) = lowered.find(prefix) {
            let start = idx + prefix.len();
            let rest = &memo[start..];
            let uuid_str: String = rest
                .chars()
                .take(36)
                .collect();
            if let Ok(uuid) = Uuid::parse_str(&uuid_str) {
                return Some(uuid);
            }
        }
    }
    None
}
