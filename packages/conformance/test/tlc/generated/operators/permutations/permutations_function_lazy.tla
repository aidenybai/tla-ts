(*---
description: permutations applied to function_lazy, a FcnLambdaValue.
ref: tlc2/module/TLC.java#Permutations
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE permutations_function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Permutations([x \in Nat |-> x]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module permutations_function_lazy failed.
    2176:0 Applying Permutations to the following value,
    which is not a finite set:
    [x \in Nat |-> <expression line 14, col 44 to line 14, col 44 of module permutations_function_lazy>]
---*)
