(*---
description: Evaluates a random record expression, seed 262, number 8631.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08631 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> (IF [a |-> 1] THEN 3 ELSE FALSE * Head(<<3, 1, 2>>)), b |-> [[[a |-> 1] EXCEPT !.a = 0] EXCEPT !.a = (0 \div 7)]] EXCEPT !.a = IF ((\A b13364 \in {x \in 1..3 : x > 1} : FALSE) /\ (<<3, 1, 2>> = [x \in Nat |-> x + 1])) THEN LET b13365 == (0 + 7) IN (0 + b13365) ELSE ([<<5, 6>> EXCEPT ![2] = 2147483647])[([a |-> 1, b |-> TRUE]).a]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08631 failed.
    A non-boolean expression (a record) was used as the condition of an IF.
    line 14, col 25 to line 14, col 74 of module random_08631
---*)
