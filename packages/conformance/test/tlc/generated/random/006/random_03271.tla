(*---
description: Evaluates a random function expression, seed 262, number 3271.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03271 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((-1 .. 3) \cup {b5206 \in SUBSET {1} : FALSE}) \ ((7 .. -1) \cap DOMAIN [x \in 1..2 |-> x])) \subseteq {b5207 \in ((<<3, 1, 2>> = [x \in Nat |-> x + 1]) \cup UNION {SUBSET {1}, {1, 2}}) : ((FALSE => TRUE) \/ (2..1 \subseteq 2..1))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03271 failed.
    To convert a function of form [x \in S |-> f(x)] to a tuple, the set S must be enumerable.
---*)
