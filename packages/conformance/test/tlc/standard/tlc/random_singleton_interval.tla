(*---
description: A one-element interval takes the interval branch.
ref: tlc2/module/TLC.java#RandomElement
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE random_singleton_interval ----
EXTENDS TLC, Naturals
Test == RandomElement(5..5) = 5
====

(*--- recorded
all:
  exit: 0
---*)
