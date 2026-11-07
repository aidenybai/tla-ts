(*---
description: The module sany/equivalence/23_SufficesAssumeProveTest.tla, which tlapm's tests parse with tlapm's parser and with SANY.
ref: test/sany/equivalence/23_SufficesAssumeProveTest.tla
features:
  - tlapm-test
mode: obligations
outcome: proved
---*)
---- MODULE 23_SufficesAssumeProveTest ----
A == TRUE
THEOREM A
PROOF
<1> SUFFICES ASSUME TRUE
             PROVE  A
  OBVIOUS
<1> QED
  BY DEF A
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 17:3:17:5
    @status: to be proved
    @obl: ASSUME A == TRUE,
           TRUE 
    PROVE  A

    @type: obligation
    @id: 2
    @loc: 15:3:15:10
    @status: to be proved
    @obl: ASSUME <1>_a3 
    PROVE  A

    @type: obligationsnumber
    @count: 2
---*)
