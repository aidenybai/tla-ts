(*---
description: seq applied to set_mixed, a SetEnumValue.
ref: tlc2/module/Sequences.java#Seq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE seq_set_mixed ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<1>> \in Seq({1, "a"}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
