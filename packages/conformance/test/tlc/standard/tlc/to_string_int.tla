(*---
description: ToString of an integer, including a negative one.
ref: tlc2/module/TLC.java#ToString
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE to_string_int ----
EXTENDS TLC, Naturals
Test == ToString(1) = "1" /\ ToString(0 - 1) = "-1"
====

(*--- recorded
all:
  exit: 0
---*)
