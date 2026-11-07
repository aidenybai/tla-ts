(*---
description: append of function_pair_domain, a FcnRcdValue, and int, a UserValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_function_pair_domain__int ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append([x \in {1}, y \in {2} |-> x + y], Int))
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
