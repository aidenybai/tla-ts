(*---
description: A blank line has no obligation, so --line on it selects nothing.
ref: src/tlapm_lib.ml#process_module
args: ["--line", "10"]
mode: obligations
outcome: empty-target
---*)
---- MODULE line_on_blank_line ----
THEOREM TRUE OBVIOUS

THEOREM 1 = 1 OBVIOUS
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    @type: obligationsnumber
    @count: 0

    File "./line_on_blank_line.tla", line 8, character 1 to line 12, character 4:
    [ERROR]: No proof obligation found for the selected target.
---*)
