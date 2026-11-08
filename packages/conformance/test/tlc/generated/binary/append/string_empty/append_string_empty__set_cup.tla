(*---
description: append of string_empty, a StringValue, and set_cup, a SetCupValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_string_empty__set_cup ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append("", {1} \cup {2}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module append_string_empty__set_cup failed.
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    ""
---*)
