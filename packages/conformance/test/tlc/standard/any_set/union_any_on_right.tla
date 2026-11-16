(*---
description: With Any on the right, {1} is tested first the same way, and a member short-circuits.
ref: tlc2/value/impl/SetCupValue.java#member
features:
  - AnySet
flags:
  - expression
outcome: success
---*)
---- MODULE union_any_on_right ----
EXTENDS TLC
Test == 1 \in {1} \cup Any
====

(*--- recorded
all:
  exit: 0
---*)
