(*---
description: An end line of 0 in --toolbox means the end of the file.
ref: src/tlapm_args.ml#set_target_end
args: ["--toolbox", "10", "0"]
mode: obligations
outcome: proved
---*)
---- MODULE toolbox_end_zero ----
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
