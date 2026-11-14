(*---
description: With --debug hidden, the hidden module-level definition is printed in the context with a hidden marker.
ref: src/expr/e_fmt.ml#elide
args: ["--debug", "hidden"]
mode: obligations
outcome: proved
---*)
---- MODULE definitions_hidden_debug ----
CONSTANT c
Op == c
THEOREM Op = Op
  OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 12:3:12:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           (* hidden *)
           Op == c
    PROVE  Op = Op

    @type: obligationsnumber
    @count: 1
---*)
