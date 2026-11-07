(*---
description: append of seq_set, a UserValue, and union, a UnionValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_seq_set__union ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(Seq({1}), UNION {{1}, {2}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    Seq({1})
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    Seq({1})
---*)
