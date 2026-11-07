(*---
description: A definition made in a proof step is visible in the later steps of that proof.
ref: src/proof/p_gen.ml#gen_step
mode: obligations
outcome: proved
---*)
---- MODULE step_definition_visible ----
CONSTANT c
THEOREM c = c
<1> F == c
<1> QED
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
           F == c
    PROVE  c = c

    @type: obligationsnumber
    @count: 1
---*)
