(*---
description: "A definition with no self-reference is built when constant definitions are processed, so its body prints once at startup and applications do not run it."
ref: "tlc2/tool/impl/SpecProcessor.java#processConstantDefns"
flags: [expression]
outcome: success
---*)
---- MODULE nonrecursive_definition_built_at_startup ----
EXTENDS Integers, TLC
P(m, v) == IF PrintT(m) THEN v ELSE v
F[n \in 1..2] == P(n, n)
Test == F[1] = 1 /\ F[1] = 1
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | 1
    | 2
---*)
