(*---
description: The module sany/equivalence/05_ConstantOperatorTest.tla, which tlapm's tests parse with tlapm's parser and with SANY.
ref: test/sany/equivalence/05_ConstantOperatorTest.tla
features:
  - tlapm-test
mode: obligations
outcome: proved
---*)
---- MODULE 05_ConstantOperatorTest ----
CONSTANT F(_, _)
op == F(1, 2)
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligationsnumber
    @count: 0
---*)
