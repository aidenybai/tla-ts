(*---
description: concat of function_empty, a FcnRcdValue, and int_minimum, a IntValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_function_empty__int_minimum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {} |-> x]) \o ((-2147483647 - 1)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module concat_function_empty__int_minimum failed.
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    -2147483648
---*)
