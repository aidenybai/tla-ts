(*---
description: append of cross, a SetOfTuplesValue, and tuple_mixed, a TupleValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_cross__tuple_mixed ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append({1, 2} \X {3}, <<1, "a", {TRUE}>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module append_cross__tuple_mixed failed.
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    {<<1, 3>>, <<2, 3>>}
---*)
