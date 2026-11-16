(*---
description: subbag applied to tuple_empty, a TupleValue.
ref: tlc2/module/Bags.java#SubBag
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subbag_tuple_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubBag(<<>>))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<>>}"
---*)
