(*---
description: Asks whether int_negative is in int, a UserValue.
ref: tlc2/value/impl/UserValue.java#member
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE in_int__int_negative ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-3) \in (Int))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
