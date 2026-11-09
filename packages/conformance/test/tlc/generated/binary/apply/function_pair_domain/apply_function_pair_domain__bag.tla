(*---
description: apply of function_pair_domain, a FcnRcdValue, and bag, a FcnRcdValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
  - tlc-bug
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_function_pair_domain__bag ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {1}, y \in {2} |-> x + y])[SetToBag({1})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 16, col 8 to line 16, col 11 of module apply_function_pair_domain__bag failed.
    Index 1 out of bounds for length 1
---*)
