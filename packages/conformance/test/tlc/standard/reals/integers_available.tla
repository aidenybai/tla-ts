(*---
description: Reals extends Integers, so integer arithmetic and Int work with the Java overrides.
ref: tlc2/module/Integers.java#Neg
features:
  - Reals
flags:
  - expression
outcome: success
---*)
---- MODULE integers_available ----
EXTENDS Reals
Test == -1 + 2 = 1 /\ -1 \in Int /\ (-1) \div 2 = -1
====

(*--- recorded
all:
  exit: 0
---*)
