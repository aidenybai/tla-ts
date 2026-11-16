(*---
description: The module sany/equivalence/09_BasicByProofTest.tla, which tlapm's tests parse with tlapm's parser and with SANY.
ref: test/sany/equivalence/09_BasicByProofTest.tla
features:
  - tlapm-test
mode: obligations
outcome: proved
---*)
---- MODULE 09_BasicByProofTest ----
A == 1
B == 1
THEOREM A = B
PROOF BY ONLY DEFS A, B
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 13:7:13:9
    @status: to be proved
    @obl: ASSUME A == 1,
           B == 1
    PROVE  A = B

    @type: obligationsnumber
    @count: 1
---*)
