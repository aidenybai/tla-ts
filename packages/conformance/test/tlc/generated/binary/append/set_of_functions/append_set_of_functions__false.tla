(*---
description: append of set_of_functions, a SetOfFcnsValue, and false, a BoolValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_set_of_functions__false ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append([{1} -> {2, 3}], FALSE))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    {<<2>>, <<3>>}
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    {<<2>>, <<3>>}
---*)
