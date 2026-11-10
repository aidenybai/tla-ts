(*---
description: A finite set can be tested for inclusion in Int.
ref: tlc2/module/Integers.java#member
features:
  - Integers
flags:
  - expression
outcome: success
---*)
---- MODULE int_subseteq ----
EXTENDS Integers
Test == {-1, 1} \subseteq Int
====

(*--- recorded
all:
  exit: 0
---*)
