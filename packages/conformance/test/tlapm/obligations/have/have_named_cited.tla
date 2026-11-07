(*---
description: Citing a numbered HAVE step makes its formula usable later.
ref: src/proof/p_gen.ml#prove_assertion
mode: obligations
outcome: proved
---*)
---- MODULE have_named_cited ----
CONSTANT A, B
THEOREM A => B
<1>1. HAVE A
<1> QED
  BY <1>1
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 12:3:12:5
    @status: to be proved
    @obl: ASSUME NEW CONSTANT A,
           NEW CONSTANT B,
           <1>1 
    PROVE  B

    @type: obligation
    @id: 2
    @loc: 12:6:12:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT A,
           NEW CONSTANT B
    PROVE  <1>1

    @type: obligation
    @id: 3
    @loc: 10:1:10:13
    @status: to be proved
    @obl: ASSUME NEW CONSTANT A,
           NEW CONSTANT B,
           <1>1 
    PROVE  A => B

    @type: obligation
    @id: 4
    @loc: 10:1:10:13
    @status: to be proved
    @obl: ASSUME NEW CONSTANT A,
           NEW CONSTANT B,
           <1>1 
    PROVE  <1>1

    @type: obligationsnumber
    @count: 4
---*)
