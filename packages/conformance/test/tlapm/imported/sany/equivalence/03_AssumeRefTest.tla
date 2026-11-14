(*---
description: The module sany/equivalence/03_AssumeRefTest.tla, which tlapm's tests parse with tlapm's parser and with SANY.
ref: test/sany/equivalence/03_AssumeRefTest.tla
features:
  - tlapm-test
mode: obligations
outcome: proved
---*)
---- MODULE 03_AssumeRefTest ----
ASSUME P == TRUE
op == P
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligationsnumber
    @count: 0
---*)
