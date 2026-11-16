(*---
description: A record over STRING is tested field by field.
ref: tlc2/module/Strings.java#member
features:
  - Strings
flags:
  - expression
outcome: success
---*)
---- MODULE record_set_membership ----
EXTENDS TLC
Test == [a |-> "x"] \in [a : STRING]
====

(*--- recorded
all:
  exit: 0
---*)
