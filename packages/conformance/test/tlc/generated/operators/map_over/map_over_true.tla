(*---
description: map_over applied to true, a BoolValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_sso
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE map_over_true ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({e : e \in TRUE})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module map_over_true failed.
    TLC encountered a non-enumerable quantifier bound
    TRUE.
    line 14, col 27 to line 14, col 30 of module map_over_true
---*)
