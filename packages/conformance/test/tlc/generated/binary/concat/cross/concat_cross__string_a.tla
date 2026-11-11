(*---
description: concat of cross, a SetOfTuplesValue, and string_a, a StringValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_cross__string_a ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1, 2} \X {3}) \o ("a"))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module concat_cross__string_a failed.
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    {<<1, 3>>, <<2, 3>>}
---*)
