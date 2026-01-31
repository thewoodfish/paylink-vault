use uuid::Uuid;

use crate::db::{models::PayLink, queries, Db};
use crate::helius::enhanced_tx::TxView;
use crate::util::json_scan::extract_paylink_id_from_memo;

use super::rail::{BoxFuture, PrivacyRail};
use super::types::PaymentMatchResult;

#[derive(Clone)]
pub struct TransparentRail;

impl TransparentRail {
    pub fn new() -> Self {
        Self
    }

    fn memo_match(&self, tx: &TxView) -> Option<Uuid> {
        for memo in &tx.memo_strings {
            if let Some(id) = extract_paylink_id_from_memo(memo) {
                return Some(id);
            }
        }
        None
    }
}

impl PrivacyRail for TransparentRail {
    fn name(&self) -> &'static str {
        "transparent"
    }

    fn receipt_rail(&self) -> &'static str {
        "transparent"
    }

    fn match_paylink<'a>(&'a self, tx: &'a TxView, db: &'a Db) -> BoxFuture<'a, Option<Uuid>> {
        Box::pin(async move {
            if let Some(id) = self.memo_match(tx) {
                return Some(id);
            }

            for transfer in &tx.token_transfers {
                if let Ok(Some(paylink)) = queries::find_pending_by_match(
                    db,
                    &transfer.destination,
                    &transfer.mint,
                    transfer.amount,
                )
                .await
                {
                    return Some(paylink.id);
                }
            }

            for transfer in &tx.native_transfers {
                if let Ok(Some(paylink)) = queries::find_pending_by_match(
                    db,
                    &transfer.destination,
                    "SOL",
                    transfer.lamports,
                )
                .await
                {
                    return Some(paylink.id);
                }
                if let Ok(Some(paylink)) = queries::find_pending_by_match(
                    db,
                    &transfer.destination,
                    "So11111111111111111111111111111111111111112",
                    transfer.lamports,
                )
                .await
                {
                    return Some(paylink.id);
                }
            }

            None
        })
    }

    fn verify_payment<'a>(
        &'a self,
        paylink: &'a PayLink,
        tx: &'a TxView,
    ) -> BoxFuture<'a, PaymentMatchResult> {
        Box::pin(async move {
            let mut matched_fields = Vec::new();

            let memo_match = self.memo_match(tx).map(|id| id == paylink.id).unwrap_or(false);
            if memo_match {
                matched_fields.push("memo".to_string());
            }

            let mut transfer_match = false;
            for transfer in &tx.token_transfers {
                if transfer.destination == paylink.merchant_pubkey
                    && transfer.mint == paylink.mint
                    && transfer.amount == paylink.expected_amount
                {
                    transfer_match = true;
                    matched_fields.push("amount".to_string());
                    matched_fields.push("mint".to_string());
                    matched_fields.push("merchantPubkey".to_string());
                    break;
                }
            }

            if !transfer_match
                && (paylink.mint == "SOL"
                    || paylink.mint == "So11111111111111111111111111111111111111112")
            {
                for transfer in &tx.native_transfers {
                    if transfer.destination == paylink.merchant_pubkey
                        && transfer.lamports == paylink.expected_amount
                    {
                        transfer_match = true;
                        matched_fields.push("amount".to_string());
                        matched_fields.push("mint".to_string());
                        matched_fields.push("merchantPubkey".to_string());
                        break;
                    }
                }
            }

            if let Some(slot) = tx.slot {
                if paylink.paid_slot == Some(slot) {
                    matched_fields.push("slot".to_string());
                }
            }

            let matched = memo_match || transfer_match;
            let reason = if matched {
                "Matched payment".to_string()
            } else {
                "No confident match".to_string()
            };

            PaymentMatchResult {
                matched,
                reason,
                matched_fields,
            }
        })
    }
}
