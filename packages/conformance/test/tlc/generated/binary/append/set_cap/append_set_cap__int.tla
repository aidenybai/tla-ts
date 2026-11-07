(*---
description: append of set_cap, a SetCapValue, and int, a UserValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_set_cap__int ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append({1, 2} \cap {2, 3}, Int))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    {2}
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    {2}
---*)
