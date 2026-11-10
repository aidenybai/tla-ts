(*---
description: ToString of Nat is its name.
ref: tlc2/module/TLC.java#ToString
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE to_string_nat ----
EXTENDS TLC, Naturals
Test == ToString(Nat) = "Nat"
====

(*--- recorded
all:
  exit: 0
---*)
