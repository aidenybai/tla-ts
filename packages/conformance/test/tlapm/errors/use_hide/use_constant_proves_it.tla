(*---
description: "USE of a declared constant that is not a fact is not an error: the constant becomes a fact with a support obligation to prove it."
ref: src/proof/p_gen.ml#gen_step
mode: obligations
outcome: proved
---*)
---- MODULE use_constant_proves_it ----
CONSTANT c
THEOREM TRUE
<1> USE c
<1> QED OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 11:9:11:16
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           c 
    PROVE  TRUE

    @type: obligation
    @id: 2
    @loc: 10:9:10:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c
    PROVE  c

    @type: obligationsnumber
    @count: 2
---*)
