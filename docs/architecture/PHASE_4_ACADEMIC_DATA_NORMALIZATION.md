# Phase 4 Academic Data Normalization

No production data was changed. No Phase 4 migration was created or executed. A safe `DATABASE_URL` is unavailable, so all database inventory and correction remain blocked.

## Safe Automatic

After a read-only inventory and backup, the following can be reported deterministically:

- Programs with Journeys, Batches, or Enrollments from conflicting Program IDs.
- Batches whose centre conflicts with the scoped Program centre.
- Batches with invalid dates or active enrollment count above capacity.
- duplicate student/program/journey enrollments, relying on the existing unique constraint;
- active TrainerAssignments outside their effective date range;
- TrainerAssignments whose User has no active Employee record or trainer role;
- curriculum Activities whose optional Batch uses another Journey or Program;
- submissions, reflections, quiz attempts, or assessment results without a matching active enrollment journey;
- student progress linked to a batch-specific Activity from another batch;
- LearningSteps with missing or invalid explicit `metadata.alttStage` values;
- review queue items with mismatched student, batch, or academic artifact.

Safe automatic means safe to identify, not safe to rewrite.

## Manual Review

- selecting the correct Journey for a Batch with no Journey;
- deciding whether a Program or Batch belongs to a missing centre/division;
- assigning missing trainers, mentors, or academic advisors;
- deciding which historical enrollment is authoritative;
- reconciling submissions or assessments tied to an incorrect journey;
- mapping legacy LearningFlow steps to Deploy, Earn, or Grow where type inference is ambiguous;
- verifying project deployment, customer/value evidence, employment, or entrepreneurship outcomes;
- determining whether inactive trainer assignments should be ended or reactivated;
- deciding whether a student without a Batch should remain in batch-pending state.

Do not invent enrollment, trainer assignment, batch, assessment score, project outcome, or organization ownership.

## Blocked

- production row counts and orphan counts;
- capacity and duplicate enrollment inventory;
- trainer/employee/organization relationship inventory;
- academic artifact ownership inventory;
- query-plan and index verification;
- database-backed student/trainer smoke tests;
- any normalization mutation.

These require an explicitly identified safe database. Production inspection must remain read-only unless a separate reviewed correction plan is approved.
