(*---
description: colon_greater of set_of_records, a SetOfRcdsValue, and function_strings, a FcnRcdValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_set_of_records__function_strings ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a : {1, 2}]) :> ([x \in {"a", "b"} |-> x]))
====

(*--- recorded
all:
  exit: 0
  transcript: '| ({[a |-> 1], [a |-> 2]} :> [a |-> "a", b |-> "b"])'
---*)
