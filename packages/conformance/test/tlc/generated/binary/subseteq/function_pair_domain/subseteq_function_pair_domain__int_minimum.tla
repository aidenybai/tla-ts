(*---
description: subseteq of function_pair_domain, a FcnRcdValue, and int_minimum, a IntValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_subseteq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseteq_function_pair_domain__int_minimum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {1}, y \in {2} |-> x + y]) \subseteq ((-2147483647 - 1)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module subseteq_function_pair_domain__int_minimum failed.
    Attempted to evaluate an expression of form S \subseteq T, but S was not enumerable.
    line 14, col 16 to line 14, col 79 of module subseteq_function_pair_domain__int_minimum
---*)
