(*---
description: An untyped model value is simply not in Nat.
ref: tlc2/value/impl/ModelValue.java#modelValueMember
features:
  - Naturals
flags:
  - expression
outcome: success
config: |
  CONSTANT mv = mv
---*)
---- MODULE nat_untyped_model_value_member ----
EXTENDS Naturals
CONSTANT mv
Test == mv \notin Nat
====

(*--- recorded
all:
  exit: 0
---*)
