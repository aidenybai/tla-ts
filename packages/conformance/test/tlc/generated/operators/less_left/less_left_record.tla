(*---
description: less_left applied to record, a RecordValue.
ref: tlc2/module/Naturals.java#LT
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE less_left_record ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> 1, b |-> 2] < 2)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module less_left_record failed.
    2266:0 The first argument of < should be an integer, but instead it is:
    [a |-> 1, b |-> 2]
---*)
