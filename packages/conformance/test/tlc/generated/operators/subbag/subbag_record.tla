(*---
description: subbag applied to record, a RecordValue.
ref: tlc2/module/Bags.java#SubBag
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subbag_record ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubBag([a |-> 1, b |-> 2]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<>>, [a |-> 1], [b |-> 1], [b |-> 2], [a |-> 1, b |-> 1], [a |-> 1, b |-> 2]}"
---*)
