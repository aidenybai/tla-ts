(*---
description: permutations applied to function_pair_domain, a FcnRcdValue.
ref: tlc2/module/TLC.java#Permutations
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE permutations_function_pair_domain ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Permutations([x \in {1}, y \in {2} |-> x + y]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module permutations_function_pair_domain failed.
    2176:0 Applying Permutations to the following value,
    which is not a finite set:
    (<<1, 2>> :> 3)
---*)
