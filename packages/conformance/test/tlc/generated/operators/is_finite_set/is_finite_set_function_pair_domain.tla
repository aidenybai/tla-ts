(*---
description: is_finite_set applied to function_pair_domain, a FcnRcdValue.
ref: tlc2/module/FiniteSets.java#IsFiniteSet
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE is_finite_set_function_pair_domain ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IsFiniteSet([x \in {1}, y \in {2} |-> x + y]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
