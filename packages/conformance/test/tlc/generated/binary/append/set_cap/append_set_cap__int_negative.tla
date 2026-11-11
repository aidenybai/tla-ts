(*---
description: append of set_cap, a SetCapValue, and int_negative, a IntValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_set_cap__int_negative ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append({1, 2} \cap {2, 3}, -3))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module append_set_cap__int_negative failed.
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    {2}
---*)
