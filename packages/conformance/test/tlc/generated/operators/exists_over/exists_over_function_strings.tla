(*---
description: exists_over applied to function_strings, a FcnRcdValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_bf
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE exists_over_function_strings ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(\E e \in [x \in {"a", "b"} |-> x] : TRUE)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module exists_over_function_strings failed.
    TLC encountered a non-enumerable quantifier bound
    [a |-> "a", b |-> "b"].
    line 14, col 25 to line 14, col 48 of module exists_over_function_strings
---*)
