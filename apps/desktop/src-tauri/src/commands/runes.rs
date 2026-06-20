use crate::lcu::{LcuCredentials, LcuHttpClient};
use serde::{Deserialize, Serialize};
use serde_json::Value;

const RIFTLENS_RUNE_PAGE_NAME: &str = "RiftLens Auto-Import";

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RunePage {
    pub name: String,
    pub primary_style_id: i32,
    pub sub_style_id: i32,
    pub selected_perk_ids: Vec<i32>,
}

#[tauri::command]
pub async fn import_rune_page(
    credentials: LcuCredentials,
    rune_page: RunePage,
) -> Result<(), String> {
    let client = LcuHttpClient::new(credentials).map_err(|e| e.to_string())?;

    // Get existing pages
    let pages: Value = client
        .get("/lol-perks/v1/pages")
        .await
        .map_err(|e| e.to_string())?;

    // Delete existing RiftLens page if present
    if let Some(arr) = pages.as_array() {
        for page in arr {
            if page["name"].as_str() == Some(RIFTLENS_RUNE_PAGE_NAME) {
                if let Some(id) = page["id"].as_i64() {
                    let path = format!("/lol-perks/v1/pages/{}", id);
                    client.delete(&path).await.map_err(|e| e.to_string())?;
                    break;
                }
            }
        }
    }

    // Create new page
    let body = serde_json::json!({
        "name": RIFTLENS_RUNE_PAGE_NAME,
        "primaryStyleId": rune_page.primary_style_id,
        "subStyleId": rune_page.sub_style_id,
        "selectedPerkIds": rune_page.selected_perk_ids,
        "current": true,
    });

    let _: Value = client
        .post("/lol-perks/v1/pages", &body)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}
