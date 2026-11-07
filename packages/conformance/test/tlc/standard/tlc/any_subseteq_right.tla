(*---
description: A finite set is a subset of Any.
ref: tlc2/module/TLC.java#Any
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE any_subseteq_right ----
EXTENDS TLC, Naturals
Test == {1, 2} \subseteq Any
====

(*--- recorded
all:
  exit: 0
---*)
