(*---
description: Tuples sort by length, then elementwise.
ref: tlc2/module/TLC.java#PrintT
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE printt_sets_of_tuples_order ----
EXTENDS TLC, Naturals
Test == PrintT({<<2>>, <<1, 1>>, <<1>>})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<1>>, <<2>>, <<1, 1>>}"
---*)
