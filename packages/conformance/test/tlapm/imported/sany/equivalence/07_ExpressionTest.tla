(*---
description: The module sany/equivalence/07_ExpressionTest.tla, which tlapm's tests parse with tlapm's parser and with SANY.
ref: test/sany/equivalence/07_ExpressionTest.tla
features:
  - tlapm-test
mode: obligations
outcome: proved
---*)
---- MODULE 07_ExpressionTest ----
ITE == IF TRUE THEN 1 ELSE 2
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligationsnumber
    @count: 0
---*)
