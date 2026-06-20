use super::auth::{parse_lcu_args, LcuCredentials};
use anyhow::Result;

/// Detects the running LeagueClientUx process and extracts credentials.
/// Cross-platform: uses process listing appropriate for each OS.
pub async fn find_lcu_credentials() -> Result<Option<LcuCredentials>> {
    #[cfg(target_os = "windows")]
    {
        find_lcu_credentials_windows().await
    }
    #[cfg(target_os = "macos")]
    {
        find_lcu_credentials_macos().await
    }
    #[cfg(target_os = "linux")]
    {
        find_lcu_credentials_linux().await
    }
}

#[cfg(target_os = "macos")]
async fn find_lcu_credentials_macos() -> Result<Option<LcuCredentials>> {
    let output = tokio::process::Command::new("pgrep")
        .args(["-a", "LeagueClientUx"])
        .output()
        .await?;

    if !output.status.success() {
        return Ok(None);
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    Ok(parse_lcu_args(&stdout))
}

#[cfg(target_os = "windows")]
async fn find_lcu_credentials_windows() -> Result<Option<LcuCredentials>> {
    let output = tokio::process::Command::new("wmic")
        .args([
            "PROCESS",
            "WHERE",
            "name='LeagueClientUx.exe'",
            "GET",
            "CommandLine",
            "/FORMAT:LIST",
        ])
        .output()
        .await?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    Ok(parse_lcu_args(&stdout))
}

#[cfg(target_os = "linux")]
async fn find_lcu_credentials_linux() -> Result<Option<LcuCredentials>> {
    use std::fs;

    let proc_dir = fs::read_dir("/proc")?;
    for entry in proc_dir.flatten() {
        let name = entry.file_name();
        let name_str = name.to_string_lossy();
        if !name_str.chars().all(|c| c.is_ascii_digit()) {
            continue;
        }
        let cmdline_path = format!("/proc/{}/cmdline", name_str);
        if let Ok(content) = fs::read_to_string(&cmdline_path) {
            if content.contains("LeagueClientUx") {
                let args = content.replace('\0', " ");
                if let Some(creds) = parse_lcu_args(&args) {
                    return Ok(Some(creds));
                }
            }
        }
    }
    Ok(None)
}
