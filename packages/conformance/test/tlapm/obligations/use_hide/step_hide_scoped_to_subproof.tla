(*---
description: A HIDE inside a subproof does not hide the fact after the subproof ends.
ref: src/proof/p_gen.ml#gen_step
mode: obligations
outcome: proved
---*)
---- MODULE step_hide_scoped_to_subproof ----
CONSTANT c
THEOREM ASSUME c = 1 PROVE c = 1
<1> c = 1
  <2> HIDE c = 1
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
    @loc: 15:3:15:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           c = 1 ,
           <1>_a5 
    PROVE  c = 1

    @type: obligation
    @id: 2
    @loc: 13:5:13:12
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c
    PROVE  c = 1

    @type: obligationsnumber
    @count: 2
---*)
