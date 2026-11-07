(*---
description: concat of string_empty, a StringValue, and tuple, a TupleValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_string_empty__tuple ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(("") \o (<<1, 2>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form t \o s when s is not a string:
    <<1, 2>>
    2182:0 Evaluating an expression of the form t \o s when s is not a string:
    <<1, 2>>
---*)
