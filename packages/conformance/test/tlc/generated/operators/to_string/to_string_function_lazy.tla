(*---
description: to_string applied to function_lazy, a FcnLambdaValue.
ref: tlc2/module/TLC.java#ToString
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE to_string_function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(ToString([x \in Nat |-> x]))
====

(*--- recorded
all:
  exit: 0
  transcript: '| "[x \\in Nat |-> <expression line 14, col 40 to line 14, col 40 of module to_string_function_lazy>]"'
---*)
