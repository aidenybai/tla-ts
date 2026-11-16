(*---
description: The module sany/equivalence/27_LabelDefinitionTest.tla, which tlapm's tests parse with tlapm's parser and with SANY.
ref: test/sany/equivalence/27_LabelDefinitionTest.tla
features:
  - tlapm-test
mode: obligations
outcome: proved
---*)
---- MODULE 27_LabelDefinitionTest ----
Foo == lab :: TRUE
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligationsnumber
    @count: 0
---*)
