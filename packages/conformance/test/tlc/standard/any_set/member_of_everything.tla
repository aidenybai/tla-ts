(*---
description: Any accepts every kind of value.
ref: tlc2/module/AnySet.java#member
features:
  - AnySet
flags:
  - expression
outcome: success
---*)
---- MODULE member_of_everything ----
EXTENDS TLC
Test == 1 \in Any /\ "a" \in Any /\ TRUE \in Any /\ {} \in Any /\ <<>> \in Any
====

(*--- recorded
all:
  exit: 0
---*)
