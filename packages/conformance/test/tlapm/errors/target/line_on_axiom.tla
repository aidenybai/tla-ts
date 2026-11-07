(*---
description: An axiom has no obligations, so --line on it selects nothing and the run exits with empty-target.
ref: src/tlapm_lib.ml#process_module
args: ["--line", "9"]
mode: obligations
outcome: empty-target
---*)
---- MODULE line_on_axiom ----
AXIOM TRUE
THEOREM TRUE OBVIOUS
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    @type: obligationsnumber
    @count: 0

    File "./line_on_axiom.tla", line 8, character 1 to line 11, character 4:
    [ERROR]: No proof obligation found for the selected target.
---*)
