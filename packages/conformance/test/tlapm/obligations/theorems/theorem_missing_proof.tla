(*---
description: A theorem without a proof gives no obligation, and --strict reports its missing proof as incomplete.
ref: src/tlapm_lib.ml#process_module
mode: obligations
outcome: incomplete
---*)
---- MODULE theorem_missing_proof ----
THEOREM 1 = 1
====

(*--- recorded
all:
  exit: 11
  transcript: |-
    @type: obligationsnumber
    @count: 0

    Missing proof at File "./theorem_missing_proof.tla", line 8, character 14
    File "./theorem_missing_proof.tla", line 7, character 1 to line 9, character 4:
    [ERROR]: Proof incomplete in module "theorem_missing_proof": 1 missing, 0 omitted proof step(s).
---*)
