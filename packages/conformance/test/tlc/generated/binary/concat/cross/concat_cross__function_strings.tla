(*---
description: concat of cross, a SetOfTuplesValue, and function_strings, a FcnRcdValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_cross__function_strings ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1, 2} \X {3}) \o ([x \in {"a", "b"} |-> x]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    {<<1, 3>>, <<2, 3>>}
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    {<<1, 3>>, <<2, 3>>}
---*)
