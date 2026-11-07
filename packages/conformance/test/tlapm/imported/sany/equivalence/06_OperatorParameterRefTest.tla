(*---
description: The module sany/equivalence/06_OperatorParameterRefTest.tla, which tlapm's tests parse with tlapm's parser and with SANY.
ref: test/sany/equivalence/06_OperatorParameterRefTest.tla
features:
  - tlapm-test
mode: obligations
outcome: proved
---*)
---- MODULE 06_OperatorParameterRefTest ----
op(x, y) == <<x, y>>
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligationsnumber
    @count: 0
---*)
