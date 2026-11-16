(*---
description: seq applied to interval, a IntervalValue.
ref: tlc2/module/Sequences.java#Seq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE seq_interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<1>> \in Seq(1..3))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
