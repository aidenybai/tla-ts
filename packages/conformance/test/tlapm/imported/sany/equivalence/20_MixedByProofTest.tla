(*---
description: The module sany/equivalence/20_MixedByProofTest.tla, which tlapm's tests parse with tlapm's parser and with SANY.
ref: test/sany/equivalence/20_MixedByProofTest.tla
features:
  - tlapm-test
mode: obligations
outcome: proved
---*)
---- MODULE 20_MixedByProofTest ----
A == TRUE
THEOREM A
PROOF
<1>1 A
  BY DEF A
<1> QED
  BY <1>1 DEF A
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 16:3:16:5
    @status: to be proved
    @obl: ASSUME A == TRUE,
           <1>1 
    PROVE  A

    @type: obligation
    @id: 2
    @loc: 16:6:16:10
    @status: to be proved
    @obl: ASSUME A == TRUE
    PROVE  <1>1

    @type: obligation
    @id: 3
    @loc: 14:3:14:5
    @status: to be proved
    @obl: ASSUME A == TRUE
    PROVE  A

    @type: obligationsnumber
    @count: 3
---*)
