(*---
description: The module sany/equivalence/00_ConstantRefTest.tla, which tlapm's tests parse with tlapm's parser and with SANY.
ref: test/sany/equivalence/00_ConstantRefTest.tla
features:
  - tlapm-test
mode: obligations
outcome: proved
---*)
---- MODULE 00_ConstantRefTest ----
CONSTANT x
CONSTANT y
CONSTANT z
op == <<x, y, z>>
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligationsnumber
    @count: 0
---*)
