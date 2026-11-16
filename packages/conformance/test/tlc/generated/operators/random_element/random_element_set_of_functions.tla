(*---
description: random_element applied to set_of_functions, a SetOfFcnsValue.
ref: tlc2/module/TLC.java#RandomElement
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_element_set_of_functions ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(RandomElement([{1} -> {2, 3}]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<3>>"
---*)
