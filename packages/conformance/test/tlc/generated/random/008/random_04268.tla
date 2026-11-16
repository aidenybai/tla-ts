(*---
description: Evaluates a random bool expression, seed 262, number 4268.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04268 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE (DOMAIN [x \in 1..2 |-> x] \subseteq {b6719 \in SUBSET {1} : FALSE}) -> ([[a |-> 1] EXCEPT !.a = @ + -1]).a [] OTHER -> ([[a |-> 1] EXCEPT !.a = @ + 1]).a < CASE ((Nat \cup Nat) = {b6720 \in <<1, 2>> : 0}) -> CASE ([a |-> 1, b |-> TRUE] = [x \in 1..2 |-> x]) -> LET b6721 == 3 IN 2147483647 [] OTHER -> (FALSE \div 1) [] OTHER -> (-Cardinality({1, 2}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04268 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
