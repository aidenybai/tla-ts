(*---
description: The function set branch picks each value from the range and keeps the normalized domain.
ref: tlc2/module/TLC.java#RandomElement
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE random_singleton_function_set ----
EXTENDS TLC, Naturals
Test == RandomElement([{2, 1} -> {3}]) = <<3, 3>>
====

(*--- recorded
all:
  exit: 0
---*)
