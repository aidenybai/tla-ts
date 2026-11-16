(*---
description: Evaluates a random set expression, seed 262, number 9319.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09319 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b14455 \in ({b14456 \in {2147483647, 1} : (Nat = {2, 1, 3})} \cup ({7, 3} \cap {TRUE : b14457 \in 1..3})) : (DOMAIN (CHOOSE f \in [{0} \cup {1} -> {2, 1, 3}] : TRUE) \subseteq {(1 + b14455), IF FALSE THEN 0 ELSE 2})})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09319 failed.
    Attempted to compare overridden value Nat with non-overridden value:
    {1, 2, 3}
---*)
