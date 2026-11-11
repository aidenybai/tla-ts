(*---
description: A user's AnySet.tla has its zero-arity ANY replaced by the Java value, whatever the definition says.
ref: tlc2/module/AnySet.java#ANY
features:
  - AnySet
flags:
  - expression
outcome: success
includes:
  - AnySet.tla
---*)
---- MODULE user_module_gets_any_override ----
EXTENDS AnySet
Test == 1 \in ANY /\ "a" \in ANY
====

(*--- recorded
all:
  exit: 0
---*)
