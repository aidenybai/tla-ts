(*---
description: subbag applied to function_empty, a FcnRcdValue.
ref: tlc2/module/Bags.java#SubBag
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subbag_function_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubBag([x \in {} |-> x]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<>>}"
---*)
