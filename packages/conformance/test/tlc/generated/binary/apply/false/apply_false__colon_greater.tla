(*---
description: apply of false, a BoolValue, and colon_greater, a FcnRcdValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_false__colon_greater ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((FALSE)[1 :> 2])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module apply_false__colon_greater failed.
    A non-function (a Boolean value) was applied as a function.
    line 14, col 16 to line 14, col 30 of module apply_false__colon_greater
---*)
