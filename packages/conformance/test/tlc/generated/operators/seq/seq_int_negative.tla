(*---
description: seq applied to int_negative, a IntValue.
ref: tlc2/module/Sequences.java#Seq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE seq_int_negative ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<1>> \in Seq(-3))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module seq_int_negative failed.
    Attempted to check if the value:
    1
    is an element of the integer -3
---*)
