(*---
description: The module sany/equivalence/29_LabelInQuantifierTest.tla, which tlapm's tests parse with tlapm's parser and with SANY.
ref: test/sany/equivalence/29_LabelInQuantifierTest.tla
features:
  - tlapm-test
mode: obligations
outcome: proved
---*)
---- MODULE 29_LabelInQuantifierTest ----
Foo == \A x : lab(x) :: x = x
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligationsnumber
    @count: 0
---*)
