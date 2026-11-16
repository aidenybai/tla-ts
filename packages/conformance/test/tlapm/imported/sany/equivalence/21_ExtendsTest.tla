(*---
description: The module sany/equivalence/21_ExtendsTest.tla, which tlapm's tests parse with tlapm's parser and with SANY.
ref: test/sany/equivalence/21_ExtendsTest.tla
features:
  - tlapm-test
mode: obligations
outcome: proved
includes:
  - 21_ExtendsBase.tla
---*)
---- MODULE 21_ExtendsTest ----
EXTENDS 21_ExtendsBase
THEOREM BaseOp
PROOF BY DEF BaseOp
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 14:7:14:9
    @status: to be proved
    @obl: ASSUME BaseOp == TRUE
    PROVE  BaseOp

    @type: obligationsnumber
    @count: 1
---*)
