(*---
description: A later step may mention a step definition, which its obligation keeps unexpanded while the definition is visible.
ref: src/proof/p_simplify.ml#simplify_step
mode: obligations
outcome: proved
---*)
---- MODULE step_definition_used_in_step ----
CONSTANT c
THEOREM c = c
<1> F == c
<1>1. F = c
  OBVIOUS
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
           F == c,
           <1>1 
    PROVE  c = c

    @type: obligation
    @id: 2
    @loc: 14:6:14:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           F == c
    PROVE  <1>1

    @type: obligation
    @id: 3
    @loc: 12:3:12:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           F == c
    PROVE  F = c

    @type: obligationsnumber
    @count: 3
---*)
