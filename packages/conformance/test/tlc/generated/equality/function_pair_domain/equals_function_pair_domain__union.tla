(*---
description: Compares function_pair_domain, a FcnRcdValue, with union, a UnionValue.
ref: tlc2/value/impl/FcnRcdValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_function_pair_domain__union ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {1}, y \in {2} |-> x + y]) = (UNION {{1}, {2}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_function_pair_domain__union failed.
    Attempted to check equality of the function (<<1, 2>> :> 3) with the value:
    {1, 2}
---*)
