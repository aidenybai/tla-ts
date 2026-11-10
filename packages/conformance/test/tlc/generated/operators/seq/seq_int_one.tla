(*---
description: seq applied to int_one, a IntValue.
ref: tlc2/module/Sequences.java#Seq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE seq_int_one ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<1>> \in Seq(1))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module seq_int_one failed.
    Attempted to check if the value:
    1
    is an element of the integer 1
---*)
