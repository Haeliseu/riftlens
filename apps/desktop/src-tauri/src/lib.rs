mod commands;
mod lcu;

pub fn run() {
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .init();

    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![
            commands::summoner::get_lcu_credentials,
            commands::summoner::get_current_summoner,
            commands::game_flow::get_gameflow_phase,
            commands::champ_select::get_champ_select_buddies,
            commands::runes::import_rune_page,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
