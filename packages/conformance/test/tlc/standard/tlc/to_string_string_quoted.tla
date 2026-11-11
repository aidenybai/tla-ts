(*---
description: ToString of a string includes the quotes.
ref: tlc2/module/TLC.java#ToString
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE to_string_string_quoted ----
EXTENDS TLC, Naturals
Test == ToString("a") = "\"a\"" /\ ToString("") = "\"\""
====

(*--- recorded
all:
  exit: 0
---*)
