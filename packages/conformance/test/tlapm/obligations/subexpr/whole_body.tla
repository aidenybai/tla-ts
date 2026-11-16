(*---
description: "Op!: names the whole body of Op."
ref: src/expr/e_deref.ml#deref
mode: obligations
outcome: proved
---*)
---- MODULE whole_body ----
CONSTANT P(_)
Op == \A x : P(x)
THEOREM Op!: = Op!:
  OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 11:3:11:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_)
    PROVE  (\A x : P(x)) = (\A x : P(x))

    @type: obligationsnumber
    @count: 1
---*)
