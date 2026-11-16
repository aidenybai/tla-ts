(*---
description: Evaluates a random set expression, seed 262, number 5966.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05966 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((DOMAIN [b9199 \in (2..1 \cup 2..1) |-> ([a |-> 1]).a] \ {LET b9200 == (2147483647 + -1) IN CASE TRUE -> b9200 [] OTHER -> b9200, (Cardinality(Nat) - [[a |-> 1, b |-> TRUE] EXCEPT !.a = <<3, 1, 2>>])}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05966 failed.
    2181:0 Attempted to compute cardinality of the value
    Nat
---*)
