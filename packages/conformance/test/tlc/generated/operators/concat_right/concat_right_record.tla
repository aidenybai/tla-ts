(*---
description: concat_right applied to record, a RecordValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_right_record ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<9>> \o [a |-> 1, b |-> 2])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    [a |-> 1, b |-> 2]
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    [a |-> 1, b |-> 2]
---*)
