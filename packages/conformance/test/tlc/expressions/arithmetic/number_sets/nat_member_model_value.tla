(*---
description: "An untyped model value is not in Nat."
ref: "tlc2/module/Naturals.java#member"
flags: [expression]
outcome: success
config: |
  CONSTANT mv = mv
---*)
---- MODULE nat_member_model_value ----
EXTENDS Integers
CONSTANT mv
Test == mv \notin Nat /\ mv \notin Int
====

(*--- recorded
all:
  exit: 0
---*)
