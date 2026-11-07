(*---
description: A theorem with an OMITTED proof gives no obligation, and --strict reports it as omitted, so the run is incomplete.
ref: src/tlapm_lib.ml#process_module
mode: obligations
outcome: incomplete
---*)
---- MODULE theorem_omitted_proof ----
THEOREM 1 = 1
  OMITTED
====

(*--- recorded
all:
  exit: 11
  transcript: |-
    @type: obligationsnumber
    @count: 0

    Omitted proof at File "./theorem_omitted_proof.tla", line 9, characters 3-9
    File "./theorem_omitted_proof.tla", line 7, character 1 to line 10, character 4:
    [ERROR]: Proof incomplete in module "theorem_omitted_proof": 0 missing, 1 omitted proof step(s).
---*)
