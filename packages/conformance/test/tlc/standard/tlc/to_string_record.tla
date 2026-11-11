(*---
description: ToString of a record.
ref: tlc2/module/TLC.java#ToString
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE to_string_record ----
EXTENDS TLC, Naturals
Test == ToString([a |-> 1]) = "[a |-> 1]"
====

(*--- recorded
all:
  exit: 0
---*)
