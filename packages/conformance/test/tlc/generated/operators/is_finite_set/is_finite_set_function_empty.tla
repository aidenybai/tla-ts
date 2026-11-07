(*---
description: is_finite_set applied to function_empty, a FcnRcdValue.
ref: tlc2/module/FiniteSets.java#IsFiniteSet
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE is_finite_set_function_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IsFiniteSet([x \in {} |-> x]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
