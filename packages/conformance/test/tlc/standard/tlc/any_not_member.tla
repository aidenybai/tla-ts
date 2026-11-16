(*---
description: \notin Any is FALSE.
ref: tlc2/module/TLC.java#Any
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE any_not_member ----
EXTENDS TLC, Naturals
Test == ~(1 \notin Any)
====

(*--- recorded
all:
  exit: 0
---*)
