(*---
description: Compares int_negative, a IntValue, with int_negative, a IntValue.
ref: tlc2/value/impl/IntValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_int_negative__int_negative ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-3) = (-3))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
