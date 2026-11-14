(*---
description: "--line on the line of a step's OBVIOUS selects that step's obligation."
ref: src/tlapm_lib.ml#toolbox_consider
args: ["--line", "11"]
mode: obligations
outcome: proved
---*)
---- MODULE line_on_leaf ----
THEOREM TRUE
<1>1. TRUE
  OBVIOUS
<1> QED BY <1>1
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 11:3:11:10
    @status: to be proved
    @obl: TRUE

    @type: obligationsnumber
    @count: 1
---*)
