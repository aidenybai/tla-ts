(*---
description: ToString of a Boolean.
ref: tlc2/module/TLC.java#ToString
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE to_string_bool ----
EXTENDS TLC, Naturals
Test == ToString(TRUE) = "TRUE" /\ ToString(FALSE) = "FALSE"
====

(*--- recorded
all:
  exit: 0
---*)
