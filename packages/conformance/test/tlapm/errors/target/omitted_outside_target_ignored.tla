(*---
description: An omitted proof outside the target is not counted, so selecting only the proved theorem exits 0.
ref: src/tlapm_lib.ml#process_module
args: ["--line", "9"]
mode: obligations
outcome: proved
---*)
---- MODULE omitted_outside_target_ignored ----
THEOREM TRUE OBVIOUS
THEOREM FALSE OMITTED
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 9:14:9:21
    @status: to be proved
    @obl: TRUE

    @type: obligationsnumber
    @count: 1
---*)
