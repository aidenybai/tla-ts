(*---
description: The module sany/equivalence/15_SufficesProofTest.tla, which tlapm's tests parse with tlapm's parser and with SANY.
ref: test/sany/equivalence/15_SufficesProofTest.tla
features:
  - tlapm-test
mode: obligations
outcome: proved
---*)
---- MODULE 15_SufficesProofTest ----
THEOREM TRUE
PROOF
<1> SUFFICES TRUE
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
    @obl: TRUE

    @type: obligation
    @id: 2
    @loc: 13:3:13:10
    @status: to be proved
    @obl: ASSUME <1>_a3 
    PROVE  TRUE

    @type: obligationsnumber
    @count: 2
---*)
