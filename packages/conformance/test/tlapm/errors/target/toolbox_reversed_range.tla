(*---
description: A --toolbox range whose end comes before its start selects nothing.
ref: src/tlapm_lib.ml#process_module
args: ["--toolbox", "10", "9"]
mode: obligations
outcome: empty-target
---*)
---- MODULE toolbox_reversed_range ----
THEOREM TRUE OBVIOUS
THEOREM 1 = 1 OBVIOUS
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    @type: obligationsnumber
    @count: 0

    File "./toolbox_reversed_range.tla", line 8, character 1 to line 11, character 4:
    [ERROR]: No proof obligation found for the selected target.
---*)
