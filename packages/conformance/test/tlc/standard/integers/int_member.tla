(*---
description: Int holds every integer.
ref: tlc2/module/Integers.java#member
features:
  - Integers
flags:
  - expression
outcome: success
---*)
---- MODULE int_member ----
EXTENDS Integers
Test == -1 \in Int /\ 0 \in Int /\ 2147483647 \in Int /\ (-2147483647 - 1) \in Int
====

(*--- recorded
all:
  exit: 0
---*)
