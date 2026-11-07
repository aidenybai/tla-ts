(*---
description: A named INSTANCE of Integers exposes Neg as -. .
ref: tlc2/module/Integers.java#Neg
features:
  - Integers
flags:
  - expression
outcome: success
---*)
---- MODULE integers_instance_named ----
EXTENDS Naturals
M == INSTANCE Integers
Test == M!-.(3) = 0 - 3 /\ 3 \in M!Int
====

(*--- recorded
all:
  exit: 0
---*)
