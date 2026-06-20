use super::auth::LcuCredentials;
use anyhow::Result;
use reqwest::Client;
use serde::{de::DeserializeOwned, Serialize};

pub struct LcuHttpClient {
    inner: Client,
    credentials: LcuCredentials,
}

impl LcuHttpClient {
    pub fn new(credentials: LcuCredentials) -> Result<Self> {
        // rustls only — no OpenSSL. Accept the LCU self-signed cert.
        let inner = Client::builder()
            .danger_accept_invalid_certs(true)
            .use_rustls_tls()
            .build()?;

        Ok(Self { inner, credentials })
    }

    pub async fn get<T: DeserializeOwned>(&self, path: &str) -> Result<T> {
        let url = format!("{}{}", self.credentials.base_url(), path);
        let res = self
            .inner
            .get(&url)
            .header("Authorization", self.credentials.auth_header())
            .send()
            .await?;

        if !res.status().is_success() {
            anyhow::bail!("LCU GET {} failed: {}", path, res.status());
        }

        Ok(res.json::<T>().await?)
    }

    pub async fn post<B: Serialize, T: DeserializeOwned>(&self, path: &str, body: &B) -> Result<T> {
        let url = format!("{}{}", self.credentials.base_url(), path);
        let res = self
            .inner
            .post(&url)
            .header("Authorization", self.credentials.auth_header())
            .json(body)
            .send()
            .await?;

        if !res.status().is_success() {
            anyhow::bail!("LCU POST {} failed: {}", path, res.status());
        }

        Ok(res.json::<T>().await?)
    }

    pub async fn delete(&self, path: &str) -> Result<()> {
        let url = format!("{}{}", self.credentials.base_url(), path);
        let res = self
            .inner
            .delete(&url)
            .header("Authorization", self.credentials.auth_header())
            .send()
            .await?;

        if !res.status().is_success() {
            anyhow::bail!("LCU DELETE {} failed: {}", path, res.status());
        }

        Ok(())
    }
}
