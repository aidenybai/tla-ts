(*---
description: Evaluates a random bool expression, seed 262, number 4711.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04711 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-(IF TRUE THEN 3 ELSE 2 + (<<5, 6>>)[2])) \in ({[[a |-> 1] EXCEPT !.a = @ + {}] : b7370 \in {b7371 \in {x \in 1..3 : x > 1} : FALSE}} \ {b7372 \in {2147483647 : b7373 \in {1}} : [a |-> b7372, b |-> FALSE]})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04711 failed.
    Attempted to evaluate an expression of form {x \in S : P(x)} when P was a record.
    line 14, col 196 to line 14, col 221 of module random_04711
---*)
