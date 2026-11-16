(*---
description: "--line N keeps only the obligations that start and end on line N, so only the second theorem's obligation is printed."
ref: src/tlapm_lib.ml#toolbox_consider
args: ["--line", "10"]
mode: obligations
outcome: proved
---*)
---- MODULE line_selects_one_theorem ----
THEOREM TRUE OBVIOUS
THEOREM 1 = 1 OBVIOUS
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

    @type: obligationsnumber
    @count: 1
---*)
