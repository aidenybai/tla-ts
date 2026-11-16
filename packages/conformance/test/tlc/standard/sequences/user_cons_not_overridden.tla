(*---
description: "A spec's own Cons keeps its definition: overrides apply only to the module's own definitions."
ref: tlc2/tool/impl/SpecProcessor.java#processModuleOverrides
features:
  - Sequences
flags:
  - expression
outcome: success
---*)
---- MODULE user_cons_not_overridden ----
EXTENDS Sequences, Naturals
Cons(a, b) == "mine"
Test == Cons(1, 2) = "mine"
====

(*--- recorded
all:
  exit: 0
---*)
