(*---
description: A filter over Any tests membership lazily.
ref: tlc2/module/AnySet.java#member
features:
  - AnySet
flags:
  - expression
outcome: success
---*)
---- MODULE filter_membership ----
EXTENDS TLC
Test == 3 \in {x \in Any : x = 3}
====

(*--- recorded
all:
  exit: 0
---*)
