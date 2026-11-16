(*---
description: forall_over applied to function_pair_domain, a FcnRcdValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_be
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE forall_over_function_pair_domain ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(\A e \in [x \in {1}, y \in {2} |-> x + y] : TRUE)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module forall_over_function_pair_domain failed.
    TLC encountered a non-enumerable quantifier bound
    (<<1, 2>> :> 3).
    line 14, col 25 to line 14, col 56 of module forall_over_function_pair_domain
---*)
