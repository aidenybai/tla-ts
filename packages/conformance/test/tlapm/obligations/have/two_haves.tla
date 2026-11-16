(*---
description: Two HAVE steps take the antecedents of nested implications in turn.
ref: src/proof/p_simplify.ml#simplify_step
mode: obligations
outcome: proved
---*)
---- MODULE two_haves ----
CONSTANT A, B, C
THEOREM A => (B => C)
<1> HAVE A
<1> HAVE B
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
    @obl: ASSUME NEW CONSTANT A,
           NEW CONSTANT B,
           NEW CONSTANT C,
           A ,
           B 
    PROVE  C

    @type: obligation
    @id: 2
    @loc: 10:1:10:11
    @status: to be proved
    @obl: ASSUME NEW CONSTANT A,
           NEW CONSTANT B,
           NEW CONSTANT C,
           <1>_a4 
    PROVE  A => (B => C)

    @type: obligation
    @id: 3
    @loc: 10:1:10:11
    @status: to be proved
    @obl: ASSUME NEW CONSTANT A,
           NEW CONSTANT B,
           NEW CONSTANT C,
           <1>_a4 
    PROVE  <1>_a4

    @type: obligation
    @id: 4
    @loc: 11:1:11:11
    @status: to be proved
    @obl: ASSUME NEW CONSTANT A,
           NEW CONSTANT B,
           NEW CONSTANT C,
           <1>_a5 
    PROVE  B => C

    @type: obligation
    @id: 5
    @loc: 11:1:11:11
    @status: to be proved
    @obl: ASSUME NEW CONSTANT A,
           NEW CONSTANT B,
           NEW CONSTANT C,
           A ,
           <1>_a5 
    PROVE  <1>_a5

    @type: obligationsnumber
    @count: 5
---*)
