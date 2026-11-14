(*---
description: "--line on a QED step selects its main obligation and the support obligations of the facts on that line."
ref: src/tlapm_lib.ml#toolbox_consider
args: ["--line", "11"]
mode: obligations
outcome: proved
---*)
---- MODULE line_on_qed_keeps_support ----
THEOREM TRUE
<1>1. TRUE OBVIOUS
<1>2. QED BY <1>1
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 11:11:11:13
    @status: to be proved
    @obl: ASSUME <1>1 
    PROVE  TRUE

    @type: obligation
    @id: 2
    @loc: 11:14:11:18
    @status: to be proved
    @obl: <1>1

    @type: obligationsnumber
    @count: 2
---*)
