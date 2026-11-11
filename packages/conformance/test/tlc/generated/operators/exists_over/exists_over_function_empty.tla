(*---
description: exists_over applied to function_empty, a FcnRcdValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_bf
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE exists_over_function_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(\E e \in [x \in {} |-> x] : TRUE)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module exists_over_function_empty failed.
    TLC encountered a non-enumerable quantifier bound
    <<>>.
    line 14, col 25 to line 14, col 40 of module exists_over_function_empty
---*)
