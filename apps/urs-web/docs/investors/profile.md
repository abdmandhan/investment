
## Investor Profile Documentation

### Purpose
Define a single source of truth for the Investor Profile feature so developers and AI agents implement the same behavior.

### Scope
The profile component must show investor information from:

1. Main investor table (`investors`)
2. Investor addresses (`investor_addresses`)
3. Investor heirs (`investor_heirs`)
4. Investor individuals (`investor_individuals`) for retail/individual investors
5. Investor corporates (`investor_corporates`) for corporate investors
6. Investor banks (`investor_banks`)

### Data Model Mapping

#### 1) Main investor table (`investors`)
Key fields:
- `id`
- `external_code`
- `first_name`, `middle_name`, `last_name`
- `email`, `phone_number`
- `risk_level_id`, `risk_point`
- `sid`
- `investor_type_id` (`I` = Individual, otherwise Corporate)
- `version`

#### 2) Investor addresses (`investor_addresses`)
One investor can have multiple addresses.
Key fields:
- `id`
- `investor_id`
- `address_type_id`
- `province_id`, `city_id`, `district_id`, `subdistrict_id`
- `postal_code`
- `address`, `address_line_2`

#### 3) Investor heirs (`investor_heirs`)
One investor can have multiple heirs.
Key fields:
- `id`
- `investor_id`
- `name`
- `relation_id`

#### 4) Investor individuals (`investor_individuals`)
Used when `investor_type_id = I`.
One-to-one with investor (`investor_id` is unique).
Key fields include:
- `birth_date`, `birth_place`, `mother_name`
- `gender_id`, `education_id`, `marital_id`, `nationality_id`
- `job_id`, `job_category_id`, `job_role_id`
- `tax_number`, `tax_effective_date`
- `card_type_id`, `card_number`
- `income_id`, `income_source_id`
- `is_employee`

#### 5) Investor corporates (`investor_corporates`)
Used for corporate investors.
One-to-one with investor (`investor_id` is unique).
Key fields include:
- `tax_number`
- `reg_date`
- `siup`
- `tdp_number`, `tdp_reg_date`
- `skd_reg_date`
- `establish_date`
- `phone_number`, `fax_number`
- `corporate_legal_id`

#### 6) Investor banks (`investor_banks`)
One investor can have multiple bank accounts.
Key fields:
- `id`
- `investor_id`
- `bank_id`, `bank_branch_id`
- `account_number`, `account_name`
- `is_active`, `is_primary`

## Business Rules

### No Delete Policy
- Investor profile data must not be hard-deleted.
- If data must be retired, mark it inactive (when field exists, for example `investor_banks.is_active`) or superseded by new versioned state.

### Update Policy (Journal-Only)
- Direct update to profile tables is not allowed from user actions.
- All user-submitted changes must create journal entries first.
- Data is applied to main tables only after approval.

## Journal Process

### Core Principle
Every main entity (`investors`, `funds`, `agents`, `transactions`) should be versioned, and relation updates are treated as an update of the main entity context.

Example:
- Admin changes only `investor_addresses`.
- System still records it as `entity = "investors"` journal activity.
- On approval, `investors.version` must increase.

### Journal Tables
- `journals`
  - `entity`, `entity_id`
  - `action` (`CREATE | UPDATE | DELETE | RESTORE`)
  - `status` (`PENDING | APPROVED | REJECTED | CANCELLED`)
  - `requested_by`, `requested_at`, `reason`
  - `approved_by`, `approved_at`, `rejection_reason`
  - `applied_at`
  - `entity_version`
- `journal_details`
  - `old_value` (JSON)
  - `new_value` (JSON)

### Required Approval Flow
1. User submits change request.
2. System stores diff in `journal_details` and creates `journals` record with `PENDING`.
3. System stores the entity snapshot version at request time in `journals.entity_version`.
4. Approver screen must show updated fields (old vs new values).
5. Admin approves.
6. System applies changes to main tables.
7. System increments main entity version.
8. System updates journal to:
   - `status = APPROVED`
   - `approved_by`, `approved_at`, `applied_at`
   - `entity_version = <new version>`

If rejected:
- `status = REJECTED`
- keep main tables unchanged
- store `rejection_reason`

### Concurrent Pending Journals (Version Conflict Rule)
If multiple `PENDING` journals exist for the same entity (example: two admins update the same investor at nearly the same time), only journals matching the current entity version can be approved.

Required approval validation:
1. Read current main entity version (example: `investors.version`).
2. Compare with pending journal snapshot version (`journals.entity_version` created at request time).
3. If versions are different, block approval for that journal.
4. Mark journal as stale (`REJECTED`) or require requester to resubmit against the latest version.

Example:
1. Investor version is `5`.
2. User A submits update -> journal A with `entity_version = 5`.
3. User B submits update -> journal B with `entity_version = 5`.
4. Approver approves journal A -> investor version becomes `6`.
5. Journal B can no longer be approved because `5 != 6`.
6. User B must update/recreate the request from latest data, or journal B is rejected.

### UI Warning Requirements (Requester + Approver)
Requester UI:
- Show warning when request is stale due to entity version mismatch.
- Message should instruct requester to refresh latest data and resubmit the request.

Approver UI:
- Show warning badge/message when pending request version differs from current entity version.
- Disable or block Approve action for stale request.
- Allow Reject with reason (recommended default action for stale request).

## Investor Profile API/Behavior Contract

### Read Contract
Investor profile response should include:
- `investors` main data
- `investor_addresses[]`
- `investor_heirs[]`
- `investor_individuals?`
- `investor_corporates?`
- `investor_banks[]`

### Update Contract
Any update from profile UI (main, address, heir, individual, corporate, bank):
- must create/update journal entry as `PENDING`
- must save snapshot version into `journals.entity_version` at request time
- must not modify main profile tables before approval
- must fail approval when `journals.entity_version` is different from current entity version

## Current Implementation Notes (as of this document)
- `updateProfile` currently journals updates for selected `investors` main fields.
- It creates:
  - `journals` with `entity = "investors"`, `action = "UPDATE"`, `status = "PENDING"`
  - `journal_details` with changed fields
- Approval apply flow is not implemented yet in `urs-web` router.
- `version` currently exists in schema for `investors`, `funds`, `agents`. `transactions` versioning is a required standard but not yet represented in current schema.

## Developer + AI Agent Checklist
- Always read/write profile using main entity context (`investors`).
- Never bypass journal flow for user-originated changes.
- Show field-level diffs in approval UI.
- Save request-time snapshot version into `journals.entity_version`.
- Enforce version match check before approval apply.
- Show stale-version warnings to both requester and approver.
- Apply changes only at approval step.
- Bump main entity version exactly once per approved journal.
- Keep journal status lifecycle consistent: `PENDING -> APPROVED/REJECTED/CANCELLED`.
