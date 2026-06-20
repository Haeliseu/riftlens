use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LcuCredentials {
    pub port: u16,
    pub password: String,
}

impl LcuCredentials {
    pub fn base_url(&self) -> String {
        format!("https://127.0.0.1:{}", self.port)
    }

    pub fn auth_header(&self) -> String {
        use base64::Engine;
        let token = format!("riot:{}", self.password);
        format!("Basic {}", base64::engine::general_purpose::STANDARD.encode(token.as_bytes()))
    }
}

pub fn parse_lcu_args(args: &str) -> Option<LcuCredentials> {
    let port_re = regex::Regex::new(r"--app-port=(\d+)").ok()?;
    let token_re = regex::Regex::new(r"--remoting-auth-token=([\w-]+)").ok()?;

    let port: u16 = port_re.captures(args)?.get(1)?.as_str().parse().ok()?;
    let password = token_re.captures(args)?.get(1)?.as_str().to_string();

    Some(LcuCredentials { port, password })
}
