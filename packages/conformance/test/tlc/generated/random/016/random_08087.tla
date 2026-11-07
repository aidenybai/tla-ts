(*---
description: Evaluates a random bool expression, seed 262, number 8087.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08087 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({{CASE [a |-> 1, b |-> TRUE] -> 7 [] OTHER -> b12495 : b12495 \in {2, 0}}, Cardinality(({2, 1, 3} \cup 1..3))} < CASE (CHOOSE r \in [a : {1, 2}] : TRUE) -> Len([<<3, 1, 2>> EXCEPT ![1] = 2147483647]) [] OTHER -> (CHOOSE b12496 \in (3 .. 1) : ({1} = 2..1))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08087 failed.
    A non-boolean expression (a record) was used as a condition of a CASE. line 14, col 24 to line 14, col 44 of module random_08087
---*)
