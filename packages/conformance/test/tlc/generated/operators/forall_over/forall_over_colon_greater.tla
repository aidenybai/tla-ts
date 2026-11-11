(*---
description: forall_over applied to colon_greater, a FcnRcdValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_be
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE forall_over_colon_greater ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(\A e \in 1 :> 2 : TRUE)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module forall_over_colon_greater failed.
    TLC encountered a non-enumerable quantifier bound
    <<2>>.
    line 14, col 25 to line 14, col 30 of module forall_over_colon_greater
---*)
