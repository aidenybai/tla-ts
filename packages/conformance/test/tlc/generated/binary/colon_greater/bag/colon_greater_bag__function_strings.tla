(*---
description: colon_greater of bag, a FcnRcdValue, and function_strings, a FcnRcdValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_bag__function_strings ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SetToBag({1})) :> ([x \in {"a", "b"} |-> x]))
====

(*--- recorded
all:
  exit: 0
  transcript: '| (<<1>> :> [a |-> "a", b |-> "b"])'
---*)
