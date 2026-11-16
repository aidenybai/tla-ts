(*---
description: Evaluates a random function expression, seed 262, number 3956.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03956 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([([b6226 \in ({} \cap Nat) |-> ([x \in 1..2 |-> x] - b6226)] @@ ((TRUE /\ TRUE) <=> (Nat = 1..3))) EXCEPT ![((([x \in 1..2 |-> x] @@ [x \in 1..2 |-> x]))[([a |-> 1, b |-> TRUE]).a] % IF ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE]) THEN Head(<<1, 2>>) ELSE (<<5, 6>>)[3])] = Head(SortSeq([<<1, 2>> EXCEPT ![1] = 2], LAMBDA p, q : p < q))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03956 failed.
    Attempted to compare overridden value Nat with non-overridden value:
    1..3
---*)
