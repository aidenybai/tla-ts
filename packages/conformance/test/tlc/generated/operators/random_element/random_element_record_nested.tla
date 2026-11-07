(*---
description: random_element applied to record_nested, a RecordValue.
ref: tlc2/module/TLC.java#RandomElement
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_element_record_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(RandomElement([a |-> [b |-> <<1>>]]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2176:0 Applying RandomElement to the following value,
    which is not a finite set:
    [a |-> [b |-> <<1>>]]
    2176:0 Applying RandomElement to the following value,
    which is not a finite set:
    [a |-> [b |-> <<1>>]]
---*)
