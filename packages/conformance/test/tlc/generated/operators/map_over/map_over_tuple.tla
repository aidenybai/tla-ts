(*---
description: map_over applied to tuple, a TupleValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_sso
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE map_over_tuple ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({e : e \in <<1, 2>>})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module map_over_tuple failed.
    TLC encountered a non-enumerable quantifier bound
    <<1, 2>>.
    line 14, col 27 to line 14, col 34 of module map_over_tuple
---*)
