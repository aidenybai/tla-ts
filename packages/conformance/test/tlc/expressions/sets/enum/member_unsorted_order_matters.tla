(*---
description: "Swapping the source order of the same mixed set makes the same membership succeed."
ref: "tlc2/value/impl/ValueVec.java#search"
flags: [expression]
outcome: success
---*)
---- MODULE member_unsorted_order_matters ----
EXTENDS Integers
Test == "a" \in {"a", 1}
====

(*--- recorded
all:
  exit: 0
---*)
