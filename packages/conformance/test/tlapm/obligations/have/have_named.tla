(*---
description: A numbered HAVE step's fact is hidden from the later steps.
ref: src/proof/p_gen.ml#prove_assertion
mode: obligations
outcome: proved
---*)
---- MODULE have_named ----
CONSTANT A, B
THEOREM A => B
<1>1. HAVE A
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
    @obl: ASSUME NEW CONSTANT A,
           NEW CONSTANT B
    PROVE  B

    @type: obligation
    @id: 2
    @loc: 10:1:10:13
    @status: to be proved
    @obl: ASSUME NEW CONSTANT A,
           NEW CONSTANT B,
           <1>1 
    PROVE  A => B

    @type: obligation
    @id: 3
    @loc: 10:1:10:13
    @status: to be proved
    @obl: ASSUME NEW CONSTANT A,
           NEW CONSTANT B,
           <1>1 
    PROVE  <1>1

    @type: obligationsnumber
    @count: 3
---*)
