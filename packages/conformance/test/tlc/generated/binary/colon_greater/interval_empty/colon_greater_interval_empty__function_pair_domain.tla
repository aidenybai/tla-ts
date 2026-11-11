(*---
description: colon_greater of interval_empty, a IntervalValue, and function_pair_domain, a FcnRcdValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_interval_empty__function_pair_domain ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((3..1) :> ([x \in {1}, y \in {2} |-> x + y]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ({} :> (<<1, 2>> :> 3))"
---*)
