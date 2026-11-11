(*---
description: Compares set_cap, a SetCapValue, with colon_greater, a FcnRcdValue.
ref: tlc2/value/impl/SetCapValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_set_cap__colon_greater ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1, 2} \cap {2, 3}) = (1 :> 2))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_set_cap__colon_greater failed.
    Attempted to check equality of the set {2} with the value:
    <<2>>
---*)
