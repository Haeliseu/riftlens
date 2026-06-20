use crate::lcu::{LcuCredentials, LcuHttpClient};
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BuddyData {
    pub puuid: String,
    pub summoner_name: String,
    pub tag_line: String,
    pub tier: String,
    pub division: String,
    pub lp: i32,
    pub champion_name: String,
    pub champ_win_rate: f32,
    pub champ_games: i32,
    pub account_win_rate: f32,
    pub account_games: i32,
    pub kda: String,
    pub tags: Vec<String>,
    pub team_id: i32,
    pub is_self: bool,
}

#[tauri::command]
pub async fn get_champ_select_buddies(
    credentials: LcuCredentials,
) -> Result<Vec<BuddyData>, String> {
    let client = LcuHttpClient::new(credentials.clone()).map_err(|e| e.to_string())?;

    let session: Value = client
        .get("/lol-champ-select/v1/session")
        .await
        .map_err(|e| e.to_string())?;

    let local_cell_id = session["localPlayerCellId"].as_i64().unwrap_or(0);
    let mut buddies = Vec::new();

    let process_team = |team: &Value, buddies: &mut Vec<BuddyData>| {
        if let Some(players) = team.as_array() {
            for player in players {
                let cell_id = player["cellId"].as_i64().unwrap_or(-1);
                let team_id = player["teamId"].as_i64().unwrap_or(100) as i32;
                let summoner_id = player["summonerId"].as_i64().unwrap_or(0).to_string();
                let is_self = cell_id == local_cell_id;

                buddies.push(BuddyData {
                    puuid: String::new(), // populated via follow-up request in production
                    summoner_name: summoner_id.clone(),
                    tag_line: String::new(),
                    tier: "Unranked".to_string(),
                    division: String::new(),
                    lp: 0,
                    champion_name: String::new(),
                    champ_win_rate: 50.0,
                    champ_games: 0,
                    account_win_rate: 50.0,
                    account_games: 0,
                    kda: "0.0".to_string(),
                    tags: Vec::new(),
                    team_id,
                    is_self,
                });
            }
        }
    };

    if let Some(my_team) = session["myTeam"].as_array() {
        let my_team_val = Value::Array(my_team.clone());
        process_team(&my_team_val, &mut buddies);
    }
    if let Some(their_team) = session["theirTeam"].as_array() {
        let their_team_val = Value::Array(their_team.clone());
        process_team(&their_team_val, &mut buddies);
    }

    Ok(buddies)
}
