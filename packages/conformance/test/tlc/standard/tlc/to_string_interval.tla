(*---
description: ToString keeps an interval's .. form.
ref: tlc2/module/TLC.java#ToString
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE to_string_interval ----
EXTENDS TLC, Naturals
Test == ToString(1..3) = "1..3"
====

(*--- recorded
all:
  exit: 0
---*)
