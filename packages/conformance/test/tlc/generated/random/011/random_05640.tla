(*---
description: Evaluates a random int expression, seed 262, number 5640.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05640 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE ((<<5, 6>>)[7] \in {b8712 : b8712 \in 2..1}) -> (CHOOSE b8713 \in UNION {SUBSET {1}, 1..3} : (3 < b8713)) [] OTHER -> SelectSeq([<<1, 2>> EXCEPT ![1] = 2], LAMBDA e : e > 0) - ([a |-> [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 3], b |-> (7 = 2)]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05640 failed.
    Attempted to access index 7 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
