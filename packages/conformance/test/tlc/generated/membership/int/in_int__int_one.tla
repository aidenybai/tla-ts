(*---
description: Asks whether int_one is in int, a UserValue.
ref: tlc2/value/impl/UserValue.java#member
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE in_int__int_one ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1) \in (Int))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
