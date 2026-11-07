(*---
description: A set is in SUBSET Any.
ref: tlc2/module/AnySet.java#member
features:
  - AnySet
flags:
  - expression
outcome: success
---*)
---- MODULE subset_of_any ----
EXTENDS TLC
Test == {1} \in SUBSET Any
====

(*--- recorded
all:
  exit: 0
---*)
