(*---
description: "TLC evaluates every constant-level zero-argument definition at startup, whether or not it is used."
ref: "tlc2/tool/impl/SpecProcessor.java#processConstantDefns"
flags: [expression]
outcome: success
---*)
---- MODULE unused_constant_definition_runs_at_startup ----
EXTENDS Integers, TLC
Unused == PrintT(1)
Test == TRUE
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
