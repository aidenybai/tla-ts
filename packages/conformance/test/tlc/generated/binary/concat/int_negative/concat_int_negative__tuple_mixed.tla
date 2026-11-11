(*---
description: concat of int_negative, a IntValue, and tuple_mixed, a TupleValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_int_negative__tuple_mixed ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-3) \o (<<1, "a", {TRUE}>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module concat_int_negative__tuple_mixed failed.
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    -3
---*)
