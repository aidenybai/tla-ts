(*---
description: The module sany/equivalence/30_HideDefStepTest.tla, which tlapm's tests parse with tlapm's parser and with SANY.
ref: test/sany/equivalence/30_HideDefStepTest.tla
features:
  - tlapm-test
mode: obligations
outcome: proved
---*)
---- MODULE 30_HideDefStepTest ----
A == TRUE
THEOREM A
PROOF
<1> HIDE DEF A
<1> QED
  BY DEF A
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 15:3:15:5
    @status: to be proved
    @obl: ASSUME A == TRUE
    PROVE  A

    @type: obligationsnumber
    @count: 1
---*)
