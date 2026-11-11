(*---
description: append of set_cup, a SetCupValue, and true, a BoolValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_set_cup__true ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append({1} \cup {2}, TRUE))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module append_set_cup__true failed.
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    {1, 2}
---*)
