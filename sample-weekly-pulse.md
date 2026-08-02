# Groww — Weekly Review Pulse
**Window:** last 8–12 weeks (May 12 – Aug 2, 2026) · **Sources:** App Store + Play Store · n=63 reviews

## Top 3 Themes
1. **KYC (19 reviews, avg 1.9★)** — repeated rejections and re-verification loops with no reason given; users resubmit identical documents.
2. **Payments (15 reviews, avg 2.1★)** — UPI/gateway timeouts, duplicate SIP debits, autopay mandate failures despite sufficient balance.
3. **Withdrawals (12 reviews, avg 2.3★)** — redemptions stuck "processing" beyond the stated SLA, with generic support responses.

## Real User Quotes
> "Uploaded a clear photo of my PAN card, still got rejected for 'unclear document'. No idea what's wrong with it." — Play Store, 1★

> "My SIP autodebit charged more than the set amount this month, no explanation from support yet." — App Store, 1★

> "Requested withdrawal 5 days ago, still shows processing. Support ticket got auto-closed without resolution." — Play Store, 1★

## Three Action Ideas
1. **Add a KYC failure-reason screen** — surface the specific rejection reason (document mismatch, blurry scan, etc.) instead of a generic "verification pending" state.
2. **Idempotency check on SIP/UPI debits** — detect and auto-flag duplicate/incorrect charges within minutes, with proactive refund status instead of silent pending.
3. **Withdrawal SLA tracker** — show a live status bar (submitted → processing → credited) with expected date, cutting support tickets for "where is my money."

*No usernames, emails, or reviewer IDs included. Theme legend and re-run steps in README.*
