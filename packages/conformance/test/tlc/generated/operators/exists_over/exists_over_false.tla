(*---
description: exists_over applied to false, a BoolValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_bf
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE exists_over_false ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(\E e \in FALSE : TRUE)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module exists_over_false failed.
    TLC encountered a non-enumerable quantifier bound
    FALSE.
    line 14, col 25 to line 14, col 29 of module exists_over_false
---*)
