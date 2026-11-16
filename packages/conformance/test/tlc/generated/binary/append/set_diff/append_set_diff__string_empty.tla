(*---
description: append of set_diff, a SetDiffValue, and string_empty, a StringValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_set_diff__string_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append({1, 2} \ {2}, ""))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module append_set_diff__string_empty failed.
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    {1}
---*)
