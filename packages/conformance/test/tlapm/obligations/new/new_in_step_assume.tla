(*---
description: NEW declarations of a step's ASSUME are in the context of the step's proof, but not of the later steps.
ref: src/proof/p_gen.ml#prove_assertion
mode: obligations
outcome: proved
---*)
---- MODULE new_in_step_assume ----
CONSTANT P(_)
THEOREM TRUE
<1>1. ASSUME NEW y PROVE P(y) => P(y)
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
    @loc: 13:3:13:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_)
    PROVE  TRUE

    @type: obligation
    @id: 2
    @loc: 11:3:11:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_),
           NEW CONSTANT y
    PROVE  P(y) => P(y)

    @type: obligationsnumber
    @count: 2
---*)
