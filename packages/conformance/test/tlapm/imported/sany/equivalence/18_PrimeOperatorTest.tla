(*---
description: The module sany/equivalence/18_PrimeOperatorTest.tla, which tlapm's tests parse with tlapm's parser and with SANY.
ref: test/sany/equivalence/18_PrimeOperatorTest.tla
features:
  - tlapm-test
mode: obligations
outcome: proved
---*)
---- MODULE 18_PrimeOperatorTest ----
VARIABLE x
THEOREM
  ASSUME x' = x
  PROVE  x = x'
PROOF OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 14:7:14:14
    @status: to be proved
    @obl: ASSUME NEW VARIABLE x,
           x' = x 
    PROVE  x = x'

    @type: obligationsnumber
    @count: 1
---*)
