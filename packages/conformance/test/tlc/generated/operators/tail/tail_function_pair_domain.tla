(*---
description: tail applied to function_pair_domain, a FcnRcdValue.
ref: tlc2/module/Sequences.java#Tail
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE tail_function_pair_domain ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail([x \in {1}, y \in {2} |-> x + y]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Tail should be a sequence, but instead it is:
    (<<1, 2>> :> 3)
    2283:0 The argument of Tail should be a sequence, but instead it is:
    (<<1, 2>> :> 3)
---*)
