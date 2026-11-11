(*---
description: exists_over applied to set_mixed, a SetEnumValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_bf
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE exists_over_set_mixed ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(\E e \in {1, "a"} : TRUE)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module exists_over_set_mixed failed.
    Attempted to compare string "a" with non-string:
    1
---*)
