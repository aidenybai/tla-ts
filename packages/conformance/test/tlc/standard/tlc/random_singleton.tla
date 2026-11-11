(*---
description: A singleton's only element is chosen.
ref: tlc2/module/TLC.java#RandomElement
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE random_singleton ----
EXTENDS TLC, Naturals
Test == RandomElement({7}) = 7
====

(*--- recorded
all:
  exit: 0
---*)
