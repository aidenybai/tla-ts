(*---
description: permutations applied to int_minimum, a IntValue.
ref: tlc2/module/TLC.java#Permutations
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE permutations_int_minimum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Permutations((-2147483647 - 1)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module permutations_int_minimum failed.
    2176:0 Applying Permutations to the following value,
    which is not a finite set:
    -2147483648
---*)
