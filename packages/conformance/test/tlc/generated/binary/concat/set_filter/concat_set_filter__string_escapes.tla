(*---
description: concat of set_filter, a SetPredValue, and string_escapes, a StringValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_set_filter__string_escapes ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({x \in 1..3 : x > 1}) \o ("a\"b\\c\n"))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    {2, 3}
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    {2, 3}
---*)
