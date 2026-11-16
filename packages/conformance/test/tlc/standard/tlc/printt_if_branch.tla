(*---
description: Only the taken IF branch prints.
ref: tlc2/module/TLC.java#PrintT
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE printt_if_branch ----
EXTENDS TLC, Naturals
Test == IF TRUE THEN PrintT("then") ELSE PrintT("else")
====

(*--- recorded
all:
  exit: 0
  transcript: '| "then"'
---*)
