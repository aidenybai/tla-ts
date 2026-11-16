(*---
description: ToString of a function with :>, in parentheses.
ref: tlc2/module/TLC.java#ToString
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE to_string_function ----
EXTENDS TLC, Naturals
Test == ToString(2 :> 3) = "(2 :> 3)"
====

(*--- recorded
all:
  exit: 0
---*)
