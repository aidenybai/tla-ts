(*---
description: "--line 0 resets the target to the whole module, overriding an earlier --line."
ref: src/tlapm_args.ml#set_target_line
args: ["--line", "10", "--line", "0"]
mode: obligations
outcome: proved
---*)
---- MODULE line_zero_selects_all ----
THEOREM TRUE OBVIOUS
THEOREM 1 = 1 OBVIOUS
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

    @type: obligation
    @id: 2
    @loc: 10:15:10:22
    @status: to be proved
    @obl: 1 = 1

    @type: obligationsnumber
    @count: 2
---*)
