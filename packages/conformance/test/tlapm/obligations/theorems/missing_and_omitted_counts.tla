(*---
description: The incomplete summary counts missing and omitted proofs separately, and lists each one.
ref: src/tlapm_lib.ml#process_module
mode: obligations
outcome: incomplete
---*)
---- MODULE missing_and_omitted_counts ----
THEOREM 1 = 1
THEOREM 2 = 2
  OMITTED
THEOREM 3 = 3
  OBVIOUS
THEOREM 4 = 4
====

(*--- recorded
all:
  exit: 11
  transcript: |-
    @type: obligation
    @id: 3
    @loc: 12:3:12:10
    @status: to be proved
    @obl: 3 = 3

    @type: obligationsnumber
    @count: 1

    Missing proof at File "./missing_and_omitted_counts.tla", line 8, character 14
    Missing proof at File "./missing_and_omitted_counts.tla", line 13, character 14
    Omitted proof at File "./missing_and_omitted_counts.tla", line 10, characters 3-9
    File "./missing_and_omitted_counts.tla", line 7, character 1 to line 14, character 4:
    [ERROR]: Proof incomplete in module "missing_and_omitted_counts": 2 missing, 1 omitted proof step(s).
---*)
