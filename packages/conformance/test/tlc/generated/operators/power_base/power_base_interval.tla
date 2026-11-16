(*---
description: power_base applied to interval, a IntervalValue.
ref: tlc2/module/Naturals.java#Expt
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE power_base_interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(1..3 ^ 2)
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1..9"
---*)
