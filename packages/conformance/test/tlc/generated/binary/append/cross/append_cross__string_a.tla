(*---
description: append of cross, a SetOfTuplesValue, and string_a, a StringValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_cross__string_a ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append({1, 2} \X {3}, "a"))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    {<<1, 3>>, <<2, 3>>}
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    {<<1, 3>>, <<2, 3>>}
---*)
