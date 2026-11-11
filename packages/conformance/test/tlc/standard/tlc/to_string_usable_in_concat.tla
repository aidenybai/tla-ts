(*---
description: ToString's result is an ordinary string for \o.
ref: tlc2/module/TLC.java#ToString
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE to_string_usable_in_concat ----
EXTENDS TLC, Naturals, Sequences
Test == "n=" \o ToString(1) = "n=1"
====

(*--- recorded
all:
  exit: 0
---*)
