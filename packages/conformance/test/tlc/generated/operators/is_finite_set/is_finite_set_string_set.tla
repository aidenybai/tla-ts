(*---
description: is_finite_set applied to string_set, a UserValue.
ref: tlc2/module/FiniteSets.java#IsFiniteSet
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE is_finite_set_string_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IsFiniteSet(STRING))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
