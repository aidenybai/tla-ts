(*---
description: ToString of a ToString adds another layer.
ref: tlc2/module/TLC.java#ToString
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE to_string_idempotent_no ----
EXTENDS TLC, Naturals
Test == ToString(ToString(1)) = "\"1\""
====

(*--- recorded
all:
  exit: 0
---*)
