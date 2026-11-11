(*---
description: Asks whether function_strings is in set_cap, a SetCapValue.
ref: tlc2/value/impl/SetCapValue.java#member
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE in_set_cap__function_strings ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {"a", "b"} |-> x]) \in ({1, 2} \cap {2, 3}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module in_set_cap__function_strings failed.
    Attempted to check equality of integer 2 with non-integer:
    [a |-> "a", b |-> "b"]
---*)
