(*---
description: is_finite_set applied to colon_greater, a FcnRcdValue.
ref: tlc2/module/FiniteSets.java#IsFiniteSet
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE is_finite_set_colon_greater ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IsFiniteSet(1 :> 2))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
