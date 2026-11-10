(*---
description: colon_greater of function_strings, a FcnRcdValue, and interval, a IntervalValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_function_strings__interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {"a", "b"} |-> x]) :> (1..3))
====

(*--- recorded
all:
  exit: 0
  transcript: '| ([a |-> "a", b |-> "b"] :> 1..3)'
---*)
