(*---
description: concat of set_of_functions, a SetOfFcnsValue, and boolean_set, a SetEnumValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_set_of_functions__boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([{1} -> {2, 3}]) \o (BOOLEAN))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    {<<2>>, <<3>>}
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    {<<2>>, <<3>>}
---*)
