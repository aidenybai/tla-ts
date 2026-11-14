(*---
description: The module sany/equivalence/22_UseDefStepTest.tla, which tlapm's tests parse with tlapm's parser and with SANY.
ref: test/sany/equivalence/22_UseDefStepTest.tla
features:
  - tlapm-test
mode: obligations
outcome: proved
---*)
---- MODULE 22_UseDefStepTest ----
A == TRUE
THEOREM A
PROOF
<1> USE DEF A
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
    @obl: ASSUME A == TRUE
    PROVE  A

    @type: obligationsnumber
    @count: 1
---*)
