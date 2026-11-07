(*---
description: seq applied to seq_set, a UserValue.
ref: tlc2/module/Sequences.java#Seq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE seq_seq_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<1>> \in Seq(Seq({1})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2158:0 Attempted to check if the value:
    1
    is an element of Seq({1}).
    2158:0 Attempted to check if the value:
    1
    is an element of Seq({1}).
---*)
