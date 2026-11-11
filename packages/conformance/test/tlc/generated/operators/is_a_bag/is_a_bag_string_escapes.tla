(*---
description: is_a_bag applied to string_escapes, a StringValue.
ref: tlc2/module/Bags.java#IsABag
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE is_a_bag_string_escapes ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IsABag("a\"b\\c\n"))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
