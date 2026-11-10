(*---
description: append of string_set, a UserValue, and subset, a SubsetValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_string_set__subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(STRING, SUBSET {1, 2}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module append_string_set__subset failed.
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    STRING
---*)
