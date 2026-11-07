(*---
description: The module sany/equivalence/01_VariableRefTest.tla, which tlapm's tests parse with tlapm's parser and with SANY.
ref: test/sany/equivalence/01_VariableRefTest.tla
features:
  - tlapm-test
mode: obligations
outcome: proved
---*)
---- MODULE 01_VariableRefTest ----
VARIABLE x
VARIABLE y
VARIABLE z
op == <<x, y, z>>
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligationsnumber
    @count: 0
---*)
