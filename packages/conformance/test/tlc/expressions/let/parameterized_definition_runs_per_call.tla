(*---
description: "A LET definition with parameters is an operator and runs once per call."
ref: "tlc2/tool/impl/Tool.java#evalImplLetInKind"
flags: [expression]
outcome: success
---*)
---- MODULE parameterized_definition_runs_per_call ----
EXTENDS Integers, TLC
P(m, v) == IF PrintT(m) THEN v ELSE v
Test == LET f(z) == P(z, z) IN f(1) + f(1) = 2
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | 1
    | 1
---*)
