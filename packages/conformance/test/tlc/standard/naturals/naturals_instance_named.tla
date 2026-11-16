(*---
description: A named INSTANCE of Naturals still gets the Java overrides.
ref: tlc2/tool/impl/SpecProcessor.java#processSpec
features:
  - Naturals
flags:
  - expression
outcome: success
---*)
---- MODULE naturals_instance_named ----
EXTENDS TLC
N == INSTANCE Naturals
Test == N!+(1, 2) = 3 /\ 3 \in N!Nat
====

(*--- recorded
all:
  exit: 0
---*)
