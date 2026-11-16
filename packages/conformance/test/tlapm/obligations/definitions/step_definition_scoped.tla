(*---
description: A step definition is local to its proof, so the steps after the enclosing step do not have it.
ref: src/proof/p_gen.ml#gen_step
mode: obligations
outcome: proved
---*)
---- MODULE step_definition_scoped ----
CONSTANT c
THEOREM c = c
<1>1. c = c
  <2> F == c
  <2> QED
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
    @loc: 15:3:15:5
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           <1>1 
    PROVE  c = c

    @type: obligation
    @id: 2
    @loc: 15:6:15:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c
    PROVE  <1>1

    @type: obligation
    @id: 3
    @loc: 13:5:13:12
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           F == c
    PROVE  c = c

    @type: obligationsnumber
    @count: 3
---*)
