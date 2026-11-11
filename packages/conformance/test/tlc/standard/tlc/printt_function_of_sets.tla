(*---
description: A function keyed by sets prints with :>.
ref: tlc2/module/TLC.java#PrintT
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE printt_function_of_sets ----
EXTENDS TLC, Naturals
Test == PrintT({1} :> 2)
====

(*--- recorded
all:
  exit: 0
  transcript: "| ({1} :> 2)"
---*)
