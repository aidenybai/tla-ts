(*---
description: append of interval_empty, a IntervalValue, and int, a UserValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_interval_empty__int ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(3..1, Int))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    {}
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    {}
---*)
