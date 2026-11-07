(*---
description: An omitted proof in the target makes the run incomplete, and that takes precedence over the empty target.
ref: src/tlapm_lib.ml#process_module
args: ["--line", "10"]
mode: obligations
outcome: incomplete
---*)
---- MODULE omitted_in_target_incomplete ----
THEOREM TRUE OBVIOUS
THEOREM FALSE OMITTED
====

(*--- recorded
all:
  exit: 11
  transcript: |-
    @type: obligationsnumber
    @count: 0

    Omitted proof at File "./omitted_in_target_incomplete.tla", line 10, characters 15-21
    File "./omitted_in_target_incomplete.tla", line 8, character 1 to line 11, character 4:
    [ERROR]: Proof incomplete in module "omitted_in_target_incomplete": 0 missing, 1 omitted proof step(s).
    File "./omitted_in_target_incomplete.tla", line 8, character 1 to line 11, character 4:
    [ERROR]: No proof obligation found for the selected target.
---*)
