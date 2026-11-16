(*---
description: Evaluates a random bool expression, seed 262, number 1939.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01939 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b3048 \in ((({1} \cup SUBSET {1}) \cap (SUBSET {1} \ Nat)) \cup UNION {([a |-> 1, b |-> TRUE] \ Nat), ({} \cup Nat)}) : ((<<b3048, b3048>> \o <<b3048, 2147483647>>) = [b3049 \in {b3050 \in 2..1 : TRUE} |-> ([a |-> 1, b |-> TRUE]).a])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01939 failed.
    Attempted to compare overridden value Nat with non-overridden value:
    [a |-> 1, b |-> TRUE] \ Nat
---*)
