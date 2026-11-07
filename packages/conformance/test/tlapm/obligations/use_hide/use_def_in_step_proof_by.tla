(*---
description: BY DEF in one step's proof does not make the definition visible in a later step.
ref: src/proof/p_simplify.ml#simplify
mode: obligations
outcome: proved
---*)
---- MODULE use_def_in_step_proof_by ----
CONSTANT c
Op == c
THEOREM Op = c
<1>1. Op = c
  BY DEF Op
<1> QED
  BY <1>1
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 14:3:14:5
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           <1>1 
    PROVE  Op = c

    @type: obligation
    @id: 2
    @loc: 14:6:14:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c
    PROVE  <1>1

    @type: obligation
    @id: 3
    @loc: 12:3:12:5
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           Op == c
    PROVE  Op = c

    @type: obligationsnumber
    @count: 3
---*)
