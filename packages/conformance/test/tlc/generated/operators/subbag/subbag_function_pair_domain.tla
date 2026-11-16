(*---
description: subbag applied to function_pair_domain, a FcnRcdValue.
ref: tlc2/module/Bags.java#SubBag
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subbag_function_pair_domain ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubBag([x \in {1}, y \in {2} |-> x + y]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<>>, (<<1, 2>> :> 1), (<<1, 2>> :> 2), (<<1, 2>> :> 3)}"
---*)
