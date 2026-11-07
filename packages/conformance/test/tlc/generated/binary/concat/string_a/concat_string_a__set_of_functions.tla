(*---
description: concat of string_a, a StringValue, and set_of_functions, a SetOfFcnsValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_string_a__set_of_functions ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(("a") \o ([{1} -> {2, 3}]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form t \o s when s is not a string:
    {<<2>>, <<3>>}
    2182:0 Evaluating an expression of the form t \o s when s is not a string:
    {<<2>>, <<3>>}
---*)
