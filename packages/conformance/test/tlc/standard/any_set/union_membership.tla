(*---
description: Any \cup S accepts a value comparable with S's elements.
ref: tlc2/module/AnySet.java#member
features:
  - AnySet
flags:
  - expression
outcome: success
---*)
---- MODULE union_membership ----
EXTENDS TLC
Test == 2 \in Any \cup {1} /\ 1 \in Any \cup {1}
====

(*--- recorded
all:
  exit: 0
---*)
