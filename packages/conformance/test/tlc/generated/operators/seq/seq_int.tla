(*---
description: seq applied to int, a UserValue.
ref: tlc2/module/Sequences.java#Seq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE seq_int ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<1>> \in Seq(Int))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
