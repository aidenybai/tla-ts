(*---
description: Int equals Int.
ref: tlc2/module/Integers.java#compareTo
features:
  - Integers
flags:
  - expression
outcome: success
---*)
---- MODULE int_equals_itself ----
EXTENDS Integers
Test == Int = Int
====

(*--- recorded
all:
  exit: 0
---*)
