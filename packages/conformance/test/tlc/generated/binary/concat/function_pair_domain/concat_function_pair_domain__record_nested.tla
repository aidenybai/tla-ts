(*---
description: concat of function_pair_domain, a FcnRcdValue, and record_nested, a RecordValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_function_pair_domain__record_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {1}, y \in {2} |-> x + y]) \o ([a |-> [b |-> <<1>>]]))
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
