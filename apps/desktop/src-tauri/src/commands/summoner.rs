use crate::lcu::{LcuCredentials, LcuHttpClient};
use crate::lcu::process::find_lcu_credentials;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LcuSummoner {
    pub account_id: i64,
    pub display_name: String,
    pub profile_icon_id: i32,
    pub puuid: String,
    pub summoner_id: i64,
    pub summoner_level: i32,
}

#[tauri::command]
pub async fn get_lcu_credentials() -> Result<LcuCredentials, String> {
    find_lcu_credentials()
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "League client not running".to_string())
}

#[tauri::command]
pub async fn get_current_summoner(credentials: LcuCredentials) -> Result<LcuSummoner, String> {
    let client = LcuHttpClient::new(credentials).map_err(|e| e.to_string())?;
    client
        .get::<LcuSummoner>("/lol-summoner/v1/current-summoner")
        .await
        .map_err(|e| e.to_string())
}
