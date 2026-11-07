(*---
description: len applied to function_pair_domain, a FcnRcdValue.
ref: tlc2/module/Sequences.java#Len
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE len_function_pair_domain ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len([x \in {1}, y \in {2} |-> x + y]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Len should be a sequence, but instead it is:
    (<<1, 2>> :> 3)
    2283:0 The argument of Len should be a sequence, but instead it is:
    (<<1, 2>> :> 3)
---*)
