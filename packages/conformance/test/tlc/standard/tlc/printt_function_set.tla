(*---
description: PrintT deep-normalizes its copy, so a function set prints enumerated.
ref: tlc2/module/TLC.java#PrintT
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE printt_function_set ----
EXTENDS TLC, Naturals
Test == PrintT([{1} -> {2, 3}])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<2>>, <<3>>}"
---*)
