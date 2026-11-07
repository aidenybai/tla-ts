(*---
description: random_element applied to interval, a IntervalValue.
ref: tlc2/module/TLC.java#RandomElement
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_element_interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(RandomElement(1..3))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 3"
---*)
