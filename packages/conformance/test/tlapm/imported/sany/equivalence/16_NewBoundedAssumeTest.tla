(*---
description: The module sany/equivalence/16_NewBoundedAssumeTest.tla, which tlapm's tests parse with tlapm's parser and with SANY.
ref: test/sany/equivalence/16_NewBoundedAssumeTest.tla
features:
  - tlapm-test
mode: obligations
outcome: proved
---*)
---- MODULE 16_NewBoundedAssumeTest ----
THEOREM
  ASSUME NEW S, NEW x \in S
  PROVE  x \in S
PROOF OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 13:7:13:14
    @status: to be proved
    @obl: ASSUME NEW CONSTANT S,
           NEW CONSTANT x \in S
    PROVE  x \in S

    @type: obligationsnumber
    @count: 1
---*)
