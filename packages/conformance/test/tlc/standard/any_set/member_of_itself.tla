(*---
description: Any is a member of itself.
ref: tlc2/module/AnySet.java#member
features:
  - AnySet
flags:
  - expression
outcome: success
---*)
---- MODULE member_of_itself ----
EXTENDS TLC
Test == Any \in Any
====

(*--- recorded
all:
  exit: 0
---*)
