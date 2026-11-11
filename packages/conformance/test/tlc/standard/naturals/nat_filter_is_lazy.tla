(*---
description: A filter over Nat can test membership without enumerating Nat.
ref: tlc2/module/Naturals.java#member
features:
  - Naturals
flags:
  - expression
outcome: success
---*)
---- MODULE nat_filter_is_lazy ----
EXTENDS Naturals
Test == 3 \in {n \in Nat : n > 2} /\ 2 \notin {n \in Nat : n > 2}
====

(*--- recorded
all:
  exit: 0
---*)
