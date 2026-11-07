(*---
description: colon_greater_key applied to function_pair_domain, a FcnRcdValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_key_function_pair_domain ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([x \in {1}, y \in {2} |-> x + y] :> 1)
====

(*--- recorded
all:
  exit: 0
  transcript: "| ((<<1, 2>> :> 3) :> 1)"
---*)
