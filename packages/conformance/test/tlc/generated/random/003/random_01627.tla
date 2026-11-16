(*---
description: Evaluates a random set expression, seed 262, number 1627.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01627 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({([<<5, 6>> EXCEPT ![7] = b2598])[(-2147483647)] : b2598 \in ((CHOOSE f \in [{1, 2} -> {1, 2} \ {1}] : TRUE) \ {b2599 \in SUBSET {1} : FALSE})} .. IF (({} <=> FALSE) \/ ([a |-> 1, b |-> TRUE] \/ FALSE)) THEN ((-1 % 2) * (3 - 3)) ELSE (IF <<1, 2>> THEN 2147483647 ELSE 2147483647 % IF FALSE THEN 3 ELSE -1)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01627 failed.
    Attempted to enumerate S \ T when S:
    <<2, 2>>
    is not enumerable.
---*)
