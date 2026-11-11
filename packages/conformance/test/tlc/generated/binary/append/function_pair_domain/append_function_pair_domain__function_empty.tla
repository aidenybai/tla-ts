(*---
description: append of function_pair_domain, a FcnRcdValue, and function_empty, a FcnRcdValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_function_pair_domain__function_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append([x \in {1}, y \in {2} |-> x + y], [x \in {} |-> x]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module append_function_pair_domain__function_empty failed.
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    (<<1, 2>> :> 3)
---*)
