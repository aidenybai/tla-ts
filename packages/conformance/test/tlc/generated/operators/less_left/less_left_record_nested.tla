(*---
description: less_left applied to record_nested, a RecordValue.
ref: tlc2/module/Naturals.java#LT
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE less_left_record_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> [b |-> <<1>>]] < 2)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2266:0 The first argument of < should be an integer, but instead it is:
    [a |-> [b |-> <<1>>]]
    2266:0 The first argument of < should be an integer, but instead it is:
    [a |-> [b |-> <<1>>]]
---*)
