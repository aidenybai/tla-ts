(*---
description: Evaluates a random set expression, seed 262, number 2733.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02733 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((UNION {2..1, 1..3} \cap (<<3, 1, 2>> \ {1})) \ ({b4314 \in 1..3 : TRUE} \cup ({x \in 1..3 : x > 1} \cap {1, 2}))) \ {IF (Nat = {}) THEN (CHOOSE b4315 \in Nat : FALSE) ELSE IF TRUE THEN 2 ELSE 2, [(CHOOSE r \in [a : 1..2] : TRUE) EXCEPT !.a = @ + ([x \in 1..2 |-> x])[-1]]}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02733 failed.
    Attempted to compare overridden value Nat with non-overridden value:
    {}
---*)
