(*---
description: tail applied to set_nested, a SetEnumValue.
ref: tlc2/module/Sequences.java#Tail
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE tail_set_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail({{1}, {}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module tail_set_nested failed.
    2283:0 The argument of Tail should be a sequence, but instead it is:
    {{}, {1}}
---*)
