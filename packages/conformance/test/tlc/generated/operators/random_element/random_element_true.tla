(*---
description: random_element applied to true, a BoolValue.
ref: tlc2/module/TLC.java#RandomElement
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_element_true ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(RandomElement(TRUE))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2176:0 Applying RandomElement to the following value,
    which is not a finite set:
    TRUE
    2176:0 Applying RandomElement to the following value,
    which is not a finite set:
    TRUE
---*)
