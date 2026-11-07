(*---
description: random_element applied to function_lazy, a FcnLambdaValue.
ref: tlc2/module/TLC.java#RandomElement
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_element_function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(RandomElement([x \in Nat |-> x]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2176:0 Applying RandomElement to the following value,
    which is not a finite set:
    [x \in Nat |-> <expression line 14, col 45 to line 14, col 45 of module random_element_function_lazy>]
    2176:0 Applying RandomElement to the following value,
    which is not a finite set:
    [x \in Nat |-> <expression line 14, col 45 to line 14, col 45 of module random_element_function_lazy>]
---*)
