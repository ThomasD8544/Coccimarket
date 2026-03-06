CREATE INDEX IF NOT EXISTS "Batch_state_quantityRemaining_dlcDate_idx"
ON "Batch"("state", "quantityRemaining", "dlcDate");
