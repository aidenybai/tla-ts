(*---
description: The module sany/equivalence/28_LabelParameterTest.tla, which tlapm's tests parse with tlapm's parser and with SANY.
ref: test/sany/equivalence/28_LabelParameterTest.tla
features:
  - tlapm-test
mode: obligations
outcome: proved
---*)
---- MODULE 28_LabelParameterTest ----
Foo(x) == lab :: x = x
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligationsnumber
    @count: 0
---*)
