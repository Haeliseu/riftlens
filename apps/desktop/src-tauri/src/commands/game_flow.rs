use crate::lcu::{LcuCredentials, LcuHttpClient};

#[tauri::command]
pub async fn get_gameflow_phase(credentials: LcuCredentials) -> Result<String, String> {
    let client = LcuHttpClient::new(credentials).map_err(|e| e.to_string())?;
    client
        .get::<String>("/lol-gameflow/v1/gameflow-phase")
        .await
        .map_err(|e| e.to_string())
}
