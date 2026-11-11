(*---
description: seq applied to set_cup, a SetCupValue.
ref: tlc2/module/Sequences.java#Seq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE seq_set_cup ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<1>> \in Seq({1} \cup {2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
