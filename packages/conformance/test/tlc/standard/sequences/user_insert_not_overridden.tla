(*---
description: A spec's own Insert, with any arity, keeps its definition.
ref: tlc2/tool/impl/SpecProcessor.java#processModuleOverrides
features:
  - Sequences
flags:
  - expression
outcome: success
---*)
---- MODULE user_insert_not_overridden ----
EXTENDS Sequences, Naturals
Insert(a) == "mine"
Test == Insert(1) = "mine"
====

(*--- recorded
all:
  exit: 0
---*)
