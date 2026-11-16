(*---
description: power_exponent applied to int_one, a IntValue.
ref: tlc2/module/Naturals.java#Expt
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE power_exponent_int_one ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(2 ^ (1))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2"
---*)
