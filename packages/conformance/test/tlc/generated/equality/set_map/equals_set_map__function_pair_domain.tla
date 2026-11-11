(*---
description: Compares set_map, a SetEnumValue, with function_pair_domain, a FcnRcdValue.
ref: tlc2/value/impl/SetEnumValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_set_map__function_pair_domain ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({x + 1 : x \in 1..2}) = ([x \in {1}, y \in {2} |-> x + y]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_set_map__function_pair_domain failed.
    Attempted to check equality of the set {2, 3} with the value:
    (<<1, 2>> :> 3)
---*)
