(*---
description: apply of function_pair_domain, a FcnRcdValue, and set_cap, a SetCapValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_function_pair_domain__set_cap ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {1}, y \in {2} |-> x + y])[{1, 2} \cap {2, 3}])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module apply_function_pair_domain__set_cap failed.
    In applying the function
    (<<1, 2>> :> 3),
    the argument list is:
    {2}
    which does not match its formal parameter.
---*)
