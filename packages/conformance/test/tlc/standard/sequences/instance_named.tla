(*---
description: A named INSTANCE of Sequences still gets the Java overrides.
ref: tlc2/tool/impl/SpecProcessor.java#processModuleOverrides
features:
  - Sequences
flags:
  - expression
outcome: success
---*)
---- MODULE instance_named ----
EXTENDS Naturals
M == INSTANCE Sequences
Test == M!Len("ab") = 2 /\ M!Tail("ab") = "b"
====

(*--- recorded
all:
  exit: 0
---*)
