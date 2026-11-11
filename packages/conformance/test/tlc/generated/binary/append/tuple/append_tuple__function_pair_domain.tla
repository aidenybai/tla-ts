(*---
description: append of tuple, a TupleValue, and function_pair_domain, a FcnRcdValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_tuple__function_pair_domain ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<1, 2>>, [x \in {1}, y \in {2} |-> x + y]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 2, (<<1, 2>> :> 3)>>"
---*)
