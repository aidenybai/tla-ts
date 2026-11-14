(*---
description: The fact of an unnumbered step <1> is visible in later steps, because an anonymous step cannot be cited.
ref: src/proof/p_gen.ml#use_assertion
mode: obligations
outcome: proved
---*)
---- MODULE anonymous_step_fact_visible ----
CONSTANT c
THEOREM c = c
<1> c = c
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
    @obl: ASSUME NEW CONSTANT c,
           <1>_a3 
    PROVE  c = c

    @type: obligation
    @id: 2
    @loc: 11:3:11:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c
    PROVE  c = c

    @type: obligationsnumber
    @count: 2
---*)
