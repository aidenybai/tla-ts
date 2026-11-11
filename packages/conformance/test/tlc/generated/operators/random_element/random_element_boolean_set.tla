(*---
description: random_element applied to boolean_set, a SetEnumValue.
ref: tlc2/module/TLC.java#RandomElement
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_element_boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(RandomElement(BOOLEAN))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
