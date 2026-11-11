(*---
description: subbag applied to tuple, a TupleValue.
ref: tlc2/module/Bags.java#SubBag
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subbag_tuple ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubBag(<<1, 2>>))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<>>, <<1>>, (2 :> 1), (2 :> 2), <<1, 1>>, <<1, 2>>}"
---*)
