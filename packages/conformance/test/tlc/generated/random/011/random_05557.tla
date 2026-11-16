(*---
description: Evaluates a random set expression, seed 262, number 5557.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05557 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({IF ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 3] = [a |-> 0, b |-> TRUE]) THEN IF ([a |-> 1] = [a |-> 1]) THEN (2 % b8601) ELSE LET b8602 == b8601 IN 3 ELSE (CHOOSE b8603 \in [b8604 \in {1, 2} |-> b8601] : (~FALSE)) : b8601 \in (UNION {{2147483647, -1}, (1..3 \cap {2, 1, 3})} \cup ({b8605 \in {1, 2} : TRUE} \cup {b8606 \in [a |-> 1, b |-> TRUE] : [a |-> 1, b |-> TRUE]}))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05557 failed.
    Attempted to enumerate { x \in S : p(x) } when S:
    [a |-> 1, b |-> TRUE]
    is not enumerable
---*)
