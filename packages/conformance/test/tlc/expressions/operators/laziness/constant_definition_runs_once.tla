(*---
description: "A constant-level definition is computed at startup once, whatever the number of uses."
ref: "tlc2/tool/impl/SpecProcessor.java#processConstantDefns"
flags: [expression]
outcome: success
---*)
---- MODULE constant_definition_runs_once ----
EXTENDS Integers, TLC
P(m, v) == IF PrintT(m) THEN v ELSE v
K == P(1, 3)
Test == K + K = 6
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
