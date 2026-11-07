(*---
description: "\\cup of two non-Reducible sets asks the left one first."
ref: "tlc2/value/impl/SetCupValue.java#member"
flags: [expression]
outcome: success
---*)
---- MODULE cup_two_non_reducible_left_first ----
EXTENDS Integers
Test == 1 \in (Nat \cup STRING)
====

(*--- recorded
all:
  exit: 0
---*)
