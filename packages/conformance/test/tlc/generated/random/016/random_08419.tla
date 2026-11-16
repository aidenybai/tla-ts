(*---
description: Evaluates a random int expression, seed 262, number 8419.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08419 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b13031 \in {(([a |-> 1, b |-> TRUE]).a + CASE TRUE -> -1 [] OTHER -> 1), ((1 - 3) \div Cardinality(SUBSET {1}))} : ((LET b13032 == b13031 IN 0 = Head(<<3, 1, 2>>)) /\ ((1..3 \cup {x \in 1..3 : x > 1}) \subseteq (3 .. -1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08419 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 17 to line 14, col 245 of module random_08419
---*)
