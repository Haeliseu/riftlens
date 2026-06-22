use crate::lcu::{LcuCredentials, LcuHttpClient};
use serde_json::Value;

/// Solo/Flex ranked stats for the logged-in summoner (raw LCU payload).
#[tauri::command]
pub async fn get_ranked_stats(credentials: LcuCredentials) -> Result<Value, String> {
    let client = LcuHttpClient::new(credentials).map_err(|e| e.to_string())?;
    client
        .get::<Value>("/lol-ranked/v1/current-ranked-stats")
        .await
        .map_err(|e| e.to_string())
}

/// Recent match history for the logged-in summoner (raw LCU payload).
#[tauri::command]
pub async fn get_recent_matches(credentials: LcuCredentials) -> Result<Value, String> {
    let client = LcuHttpClient::new(credentials).map_err(|e| e.to_string())?;
    client
        .get::<Value>(
            "/lol-match-history/v1/products/lol/current-summoner/matches?begIndex=0&endIndex=20",
        )
        .await
        .map_err(|e| e.to_string())
}
