(*---
description: head applied to set_nested, a SetEnumValue.
ref: tlc2/module/Sequences.java#Head
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE head_set_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head({{1}, {}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Head should be a sequence, but instead it is:
    {{}, {1}}
    2283:0 The argument of Head should be a sequence, but instead it is:
    {{}, {1}}
---*)
