(*---
description: SUBSET of {} takes the default branch.
ref: tlc2/module/TLC.java#RandomElement
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE random_default_branch_subset ----
EXTENDS TLC, Naturals
Test == RandomElement(SUBSET {}) = {}
====

(*--- recorded
all:
  exit: 0
---*)
