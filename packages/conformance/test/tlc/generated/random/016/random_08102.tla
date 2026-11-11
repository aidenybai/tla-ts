(*---
description: Evaluates a random record expression, seed 262, number 8102.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08102 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ((CHOOSE f \in [{2, 1, 3} -> {1}] : TRUE)).a, b |-> (({b12517 \in {1} : TRUE} \subseteq {b12518 : b12518 \in {x \in 1..3 : x > 1}}) => (\E b12519 \in (3 .. 3) : (3 < FALSE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08102 failed.
    Attempted to check equality of integer 1 with non-integer:
    "a"
---*)
