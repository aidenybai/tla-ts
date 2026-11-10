(*---
description: ToString of 1 :> v is a tuple.
ref: tlc2/module/TLC.java#ToString
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE to_string_sequence_function ----
EXTENDS TLC, Naturals
Test == ToString(1 :> 3) = "<<3>>"
====

(*--- recorded
all:
  exit: 0
---*)
