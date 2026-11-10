(*---
description: is_a_bag applied to string_set, a UserValue.
ref: tlc2/module/Bags.java#IsABag
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE is_a_bag_string_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IsABag(STRING))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
