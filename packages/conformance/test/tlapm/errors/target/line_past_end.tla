(*---
description: A line past the end of the module selects nothing.
ref: src/tlapm_lib.ml#process_module
args: ["--line", "99"]
mode: obligations
outcome: empty-target
---*)
---- MODULE line_past_end ----
THEOREM TRUE OBVIOUS
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    @type: obligationsnumber
    @count: 0

    File "./line_past_end.tla", line 8, character 1 to line 10, character 4:
    [ERROR]: No proof obligation found for the selected target.
---*)
