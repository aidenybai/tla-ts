(*---
description: append of true, a BoolValue, and colon_greater, a FcnRcdValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_true__colon_greater ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(TRUE, 1 :> 2))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module append_true__colon_greater failed.
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    TRUE
---*)
