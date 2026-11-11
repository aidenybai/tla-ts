(*---
description: Any finite set is included in Any.
ref: tlc2/module/AnySet.java#member
features:
  - AnySet
flags:
  - expression
outcome: success
---*)
---- MODULE subseteq_any ----
EXTENDS TLC
Test == {1, 2} \subseteq Any
====

(*--- recorded
all:
  exit: 0
---*)
