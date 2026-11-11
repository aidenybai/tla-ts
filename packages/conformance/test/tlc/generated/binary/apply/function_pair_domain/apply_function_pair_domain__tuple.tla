(*---
description: apply of function_pair_domain, a FcnRcdValue, and tuple, a TupleValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_function_pair_domain__tuple ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {1}, y \in {2} |-> x + y])[<<1, 2>>])
====

(*--- recorded
all:
  exit: 0
  transcript: "| 3"
---*)
