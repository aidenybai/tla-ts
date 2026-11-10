(*---
description: Evaluates a random int expression, seed 262, number 9162.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09162 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([a |-> Head(<<1, 2>>), b |-> (1 \in 1..3)]).a \div (CHOOSE b14231 \in (Cardinality({x \in 1..3 : x > 1}) .. CASE TRUE -> 1 [] OTHER -> -1) : (DOMAIN <<5, 6>> \subseteq (2..1 \ {})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09162 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 70 to line 14, col 197 of module random_09162
---*)
