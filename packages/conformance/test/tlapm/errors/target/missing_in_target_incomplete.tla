(*---
description: A missing proof in the target makes the run incomplete, though the target has no obligation.
ref: src/tlapm_lib.ml#process_module
args: ["--line", "10"]
mode: obligations
outcome: incomplete
---*)
---- MODULE missing_in_target_incomplete ----
THEOREM TRUE OBVIOUS
THEOREM FALSE
====

(*--- recorded
all:
  exit: 11
  transcript: |-
    @type: obligationsnumber
    @count: 0

    Missing proof at File "./missing_in_target_incomplete.tla", line 10, character 14
    File "./missing_in_target_incomplete.tla", line 8, character 1 to line 11, character 4:
    [ERROR]: Proof incomplete in module "missing_in_target_incomplete": 1 missing, 0 omitted proof step(s).
    File "./missing_in_target_incomplete.tla", line 8, character 1 to line 11, character 4:
    [ERROR]: No proof obligation found for the selected target.
---*)
