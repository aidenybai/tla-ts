(*---
description: A filter takes the default branch through toSetEnum.
ref: tlc2/module/TLC.java#RandomElement
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE random_default_branch_filter ----
EXTENDS TLC, Naturals
Test == RandomElement({x \in 1..3 : x = 2}) = 2
====

(*--- recorded
all:
  exit: 0
---*)
