(*---
description: ToString of a tuple.
ref: tlc2/module/TLC.java#ToString
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE to_string_tuple ----
EXTENDS TLC, Naturals
Test == ToString(<<1, "a">>) = "<<1, \"a\">>" /\ ToString(<<>>) = "<<>>"
====

(*--- recorded
all:
  exit: 0
---*)
