(*---
description: Any is a member of itself.
ref: tlc2/module/TLC.java#Any
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE any_contains_itself ----
EXTENDS TLC, Naturals
Test == Any \in Any
====

(*--- recorded
all:
  exit: 0
---*)
