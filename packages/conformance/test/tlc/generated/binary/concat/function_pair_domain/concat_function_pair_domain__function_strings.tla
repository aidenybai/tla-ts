(*---
description: concat of function_pair_domain, a FcnRcdValue, and function_strings, a FcnRcdValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_function_pair_domain__function_strings ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {1}, y \in {2} |-> x + y]) \o ([x \in {"a", "b"} |-> x]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    (<<1, 2>> :> 3)
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    (<<1, 2>> :> 3)
---*)
