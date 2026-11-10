(*---
description: apply of colon_greater, a FcnRcdValue, and int_negative, a IntValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_colon_greater__int_negative ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1 :> 2)[-3])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module apply_colon_greater__int_negative failed.
    Attempted to apply function:
    <<2>>
    to argument -3, which is not in the domain of the function.
---*)
