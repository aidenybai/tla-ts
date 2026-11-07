(*---
description: append of function_pair_domain, a FcnRcdValue, and set_filter, a SetPredValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_function_pair_domain__set_filter ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append([x \in {1}, y \in {2} |-> x + y], {x \in 1..3 : x > 1}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    (<<1, 2>> :> 3)
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    (<<1, 2>> :> 3)
---*)
