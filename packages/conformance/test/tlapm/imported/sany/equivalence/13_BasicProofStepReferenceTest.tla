(*---
description: The module sany/equivalence/13_BasicProofStepReferenceTest.tla, which tlapm's tests parse with tlapm's parser and with SANY.
ref: test/sany/equivalence/13_BasicProofStepReferenceTest.tla
features:
  - tlapm-test
mode: obligations
outcome: proved
---*)
---- MODULE 13_BasicProofStepReferenceTest ----
A == FALSE
B == TRUE
THEOREM A => B
PROOF
<1>a ~A BY ONLY DEF A
<1> QED BY <1>a

====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 15:9:15:11
    @status: to be proved
    @obl: ASSUME <1>a 
    PROVE  A => B

    @type: obligation
    @id: 2
    @loc: 15:12:15:16
    @status: to be proved
    @obl: <1>a

    @type: obligation
    @id: 3
    @loc: 14:9:14:11
    @status: to be proved
    @obl: ASSUME A == FALSE
    PROVE  ~A

    @type: obligationsnumber
    @count: 3
---*)
