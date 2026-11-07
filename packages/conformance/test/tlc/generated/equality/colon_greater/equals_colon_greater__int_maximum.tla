(*---
description: Compares colon_greater, a FcnRcdValue, with int_maximum, a IntValue.
ref: tlc2/value/impl/FcnRcdValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_colon_greater__int_maximum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1 :> 2) = (2147483647))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_colon_greater__int_maximum failed.
    Attempted to check equality of the function <<2>> with the value:
    2147483647
---*)
