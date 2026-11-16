(*---
description: Integers exports Nat, the same Naturals value.
ref: tlc2/module/Integers.java#Nat
features:
  - Integers
flags:
  - expression
outcome: success
---*)
---- MODULE nat_exported ----
EXTENDS Integers
Test == Nat = Nat /\ -1 \notin Nat /\ 1 \in Nat
====

(*--- recorded
all:
  exit: 0
---*)
