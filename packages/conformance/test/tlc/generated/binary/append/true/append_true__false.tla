(*---
description: append of true, a BoolValue, and false, a BoolValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_true__false ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(TRUE, FALSE))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    TRUE
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    TRUE
---*)
