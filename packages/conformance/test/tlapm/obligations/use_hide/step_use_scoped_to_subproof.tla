(*---
description: A USE DEF inside a subproof does not make the definition visible after the subproof ends.
ref: src/proof/p_gen.ml#gen_step
mode: obligations
outcome: proved
---*)
---- MODULE step_use_scoped_to_subproof ----
CONSTANT c
Op == c
THEOREM Op = c
<1>1. Op = c
  <2> USE DEF Op
  <2> QED
    OBVIOUS
<1> QED
  OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 16:3:16:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c
    PROVE  Op = c

    @type: obligation
    @id: 2
    @loc: 14:5:14:12
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           Op == c
    PROVE  Op = c

    @type: obligationsnumber
    @count: 2
---*)
