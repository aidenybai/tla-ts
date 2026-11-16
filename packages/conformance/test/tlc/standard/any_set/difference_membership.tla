(*---
description: Any \ S excludes S and nothing else.
ref: tlc2/module/AnySet.java#member
features:
  - AnySet
flags:
  - expression
outcome: success
---*)
---- MODULE difference_membership ----
EXTENDS TLC
Test == 2 \in Any \ {1} /\ 1 \notin Any \ {1}
====

(*--- recorded
all:
  exit: 0
---*)
