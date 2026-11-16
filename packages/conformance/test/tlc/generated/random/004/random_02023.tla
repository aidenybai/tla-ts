(*---
description: Evaluates a random set expression, seed 262, number 2023.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02023 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CASE [a |-> 1] -> 1 [] OTHER -> -1 * [a |-> 2147483647, b |-> FALSE]) .. LET b3210 == (CHOOSE b3211 \in 1..3 : TRUE) IN Head(<<3, 1, 2>>)) \cap DOMAIN ((CHOOSE b3212 \in {} : FALSE) :> (-7))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02023 failed.
    A non-boolean expression (a record) was used as a condition of a CASE. line 14, col 24 to line 14, col 32 of module random_02023
---*)
