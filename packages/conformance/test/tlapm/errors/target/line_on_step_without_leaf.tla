(*---
description: An obligation is located at its leaf proof, so --line on a step whose OBVIOUS is on the next line selects nothing.
ref: src/tlapm_lib.ml#toolbox_consider
args: ["--line", "10"]
mode: obligations
outcome: empty-target
---*)
---- MODULE line_on_step_without_leaf ----
THEOREM TRUE
<1>1. TRUE
  OBVIOUS
<1> QED BY <1>1
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    @type: obligationsnumber
    @count: 0

    File "./line_on_step_without_leaf.tla", line 8, character 1 to line 13, character 4:
    [ERROR]: No proof obligation found for the selected target.
---*)
