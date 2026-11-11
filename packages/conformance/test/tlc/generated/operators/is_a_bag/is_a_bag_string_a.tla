(*---
description: is_a_bag applied to string_a, a StringValue.
ref: tlc2/module/Bags.java#IsABag
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE is_a_bag_string_a ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IsABag("a"))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
