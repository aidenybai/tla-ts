(*---
description: seq applied to interval_empty, a IntervalValue.
ref: tlc2/module/Sequences.java#Seq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE seq_interval_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<1>> \in Seq(3..1))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
