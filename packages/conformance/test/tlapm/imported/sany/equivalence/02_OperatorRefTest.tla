(*---
description: The module sany/equivalence/02_OperatorRefTest.tla, which tlapm's tests parse with tlapm's parser and with SANY.
ref: test/sany/equivalence/02_OperatorRefTest.tla
features:
  - tlapm-test
mode: obligations
outcome: proved
---*)
---- MODULE 02_OperatorRefTest ----
op == 0
op2 == op
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligationsnumber
    @count: 0
---*)
