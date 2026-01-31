use std::future::Future;
use std::pin::Pin;

use uuid::Uuid;

use crate::db::models::PayLink;
use crate::db::Db;
use crate::helius::enhanced_tx::TxView;

use super::types::PaymentMatchResult;

pub type BoxFuture<'a, T> = Pin<Box<dyn Future<Output = T> + Send + 'a>>;

pub trait PrivacyRail: Send + Sync {
    fn name(&self) -> &'static str;
    fn receipt_rail(&self) -> &'static str;
    fn match_paylink<'a>(&'a self, tx: &'a TxView, db: &'a Db) -> BoxFuture<'a, Option<Uuid>>;
    fn verify_payment<'a>(
        &'a self,
        paylink: &'a PayLink,
        tx: &'a TxView,
    ) -> BoxFuture<'a, PaymentMatchResult>;
}

#[derive(Clone)]
pub struct RailSelector {
    rail_name: String,
}

impl RailSelector {
    pub fn new(name: &str) -> Self {
        Self {
            rail_name: name.to_string(),
        }
    }

    pub fn active(&self) -> Box<dyn PrivacyRail> {
        match self.rail_name.as_str() {
            "light" => Box::new(super::light_stub::LightRail::new()),
            _ => Box::new(super::transparent::TransparentRail::new()),
        }
    }
}
