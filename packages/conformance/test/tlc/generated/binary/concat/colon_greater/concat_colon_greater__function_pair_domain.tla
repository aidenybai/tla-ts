(*---
description: concat of colon_greater, a FcnRcdValue, and function_pair_domain, a FcnRcdValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_colon_greater__function_pair_domain ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1 :> 2) \o ([x \in {1}, y \in {2} |-> x + y]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    (<<1, 2>> :> 3)
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    (<<1, 2>> :> 3)
---*)
