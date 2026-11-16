(*---
description: ToString escapes what the string holds.
ref: tlc2/module/TLC.java#ToString
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE to_string_string_escaped ----
EXTENDS TLC, Naturals
Test == ToString("a\"b") = "\"a\\\"b\""
====

(*--- recorded
all:
  exit: 0
---*)
