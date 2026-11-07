(*---
description: concat_right applied to seq_set, a UserValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_right_seq_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<9>> \o Seq({1}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    Seq({1})
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    Seq({1})
---*)
