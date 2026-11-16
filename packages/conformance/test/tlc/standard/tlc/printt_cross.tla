(*---
description: PrintT deep-normalizes its copy, so a product prints enumerated.
ref: tlc2/module/TLC.java#PrintT
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE printt_cross ----
EXTENDS TLC, Naturals
Test == PrintT({1, 2} \X {3})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<1, 3>>, <<2, 3>>}"
---*)
