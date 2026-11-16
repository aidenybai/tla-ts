(*---
description: seq applied to nat, a UserValue.
ref: tlc2/module/Sequences.java#Seq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE seq_nat ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<1>> \in Seq(Nat))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
