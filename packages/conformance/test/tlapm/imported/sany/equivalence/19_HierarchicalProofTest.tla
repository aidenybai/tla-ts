(*---
description: The module sany/equivalence/19_HierarchicalProofTest.tla, which tlapm's tests parse with tlapm's parser and with SANY.
ref: test/sany/equivalence/19_HierarchicalProofTest.tla
features:
  - tlapm-test
mode: obligations
outcome: proved
---*)
---- MODULE 19_HierarchicalProofTest ----
THEOREM TRUE
PROOF
<1>1 TRUE
  <2> QED
    OBVIOUS
<1> QED
  BY <1>1
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 16:3:16:5
    @status: to be proved
    @obl: ASSUME <1>1 
    PROVE  TRUE

    @type: obligation
    @id: 2
    @loc: 16:6:16:10
    @status: to be proved
    @obl: <1>1

    @type: obligation
    @id: 3
    @loc: 14:5:14:12
    @status: to be proved
    @obl: TRUE

    @type: obligationsnumber
    @count: 3
---*)
