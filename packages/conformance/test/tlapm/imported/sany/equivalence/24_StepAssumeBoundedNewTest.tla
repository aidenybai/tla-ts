(*---
description: The module sany/equivalence/24_StepAssumeBoundedNewTest.tla, which tlapm's tests parse with tlapm's parser and with SANY.
ref: test/sany/equivalence/24_StepAssumeBoundedNewTest.tla
features:
  - tlapm-test
mode: obligations
outcome: proved
---*)
---- MODULE 24_StepAssumeBoundedNewTest ----
CONSTANT Key
THEOREM TRUE
PROOF
<1>1 ASSUME NEW k \in Key
     PROVE TRUE
     OBVIOUS
<1> QED BY <1>1
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 16:9:16:11
    @status: to be proved
    @obl: ASSUME NEW CONSTANT Key,
           <1>1 
    PROVE  TRUE

    @type: obligation
    @id: 2
    @loc: 16:12:16:16
    @status: to be proved
    @obl: ASSUME NEW CONSTANT Key
    PROVE  <1>1

    @type: obligation
    @id: 3
    @loc: 15:6:15:13
    @status: to be proved
    @obl: ASSUME NEW CONSTANT Key,
           NEW CONSTANT k \in Key
    PROVE  TRUE

    @type: obligationsnumber
    @count: 3
---*)
