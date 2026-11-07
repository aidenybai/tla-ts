(*---
description: subbag applied to record_nested, a RecordValue.
ref: tlc2/module/Bags.java#SubBag
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subbag_record_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubBag([a |-> [b |-> <<1>>]]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2266:0 The first argument of >= should be an integer, but instead it is:
    [b |-> <<1>>]
    2266:0 The first argument of >= should be an integer, but instead it is:
    [b |-> <<1>>]
---*)
