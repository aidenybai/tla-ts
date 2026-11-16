(*---
description: seq applied to set_empty, a SetEnumValue.
ref: tlc2/module/Sequences.java#Seq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE seq_set_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<1>> \in Seq({}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
