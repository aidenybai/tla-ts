(*---
description: The module sany/equivalence/11_BasicAssumeProveTest.tla, which tlapm's tests parse with tlapm's parser and with SANY.
ref: test/sany/equivalence/11_BasicAssumeProveTest.tla
features:
  - tlapm-test
mode: obligations
outcome: proved
---*)
---- MODULE 11_BasicAssumeProveTest ----
THEOREM
  ASSUME
    NEW CONSTANT A,
    NEW CONSTANT B,
    NEW CONSTANT C
  PROVE
    /\ A = B
    /\ B = C
    => A = C
PROOF OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 19:7:19:14
    @status: to be proved
    @obl: ASSUME NEW CONSTANT A,
           NEW CONSTANT B,
           NEW CONSTANT C
    PROVE  (/\ A = B
            /\ B = C) => A = C

    @type: obligationsnumber
    @count: 1
---*)
