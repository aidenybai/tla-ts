(*---
description: "--toolbox s e keeps the obligations that lie within lines s to e."
ref: src/tlapm_lib.ml#toolbox_consider
args: ["--toolbox", "10", "11"]
mode: obligations
outcome: proved
---*)
---- MODULE toolbox_range ----
THEOREM TRUE OBVIOUS
THEOREM 1 = 1 OBVIOUS
THEOREM 2 = 2 OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 10:15:10:22
    @status: to be proved
    @obl: 1 = 1

    @type: obligation
    @id: 2
    @loc: 11:15:11:22
    @status: to be proved
    @obl: 2 = 2

    @type: obligationsnumber
    @count: 2
---*)
