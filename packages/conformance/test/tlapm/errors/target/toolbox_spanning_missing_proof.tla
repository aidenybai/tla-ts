(*---
description: A --toolbox range that covers the whole multi-line theorem includes its missing proof, so the run is incomplete.
ref: src/tlapm_lib.ml#process_module
args: ["--toolbox", "10", "11"]
mode: obligations
outcome: incomplete
---*)
---- MODULE toolbox_spanning_missing_proof ----
THEOREM TRUE OBVIOUS
THEOREM
  FALSE
====

(*--- recorded
all:
  exit: 11
  transcript: |-
    @type: obligationsnumber
    @count: 0

    Missing proof at File "./toolbox_spanning_missing_proof.tla", line 11, character 8
    File "./toolbox_spanning_missing_proof.tla", line 8, character 1 to line 12, character 4:
    [ERROR]: Proof incomplete in module "toolbox_spanning_missing_proof": 1 missing, 0 omitted proof step(s).
    File "./toolbox_spanning_missing_proof.tla", line 8, character 1 to line 12, character 4:
    [ERROR]: No proof obligation found for the selected target.
---*)
