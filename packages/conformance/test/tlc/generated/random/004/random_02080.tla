(*---
description: Evaluates a random set expression, seed 262, number 2080.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02080 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({([a |-> 1]).a : b3309 \in <<7, 1>>} \ (LET b3310 == 2 IN b3310 .. (2147483647 \div 2147483647))) \ (({0, 2147483647} \cap {1 : b3311 \in 2..1}) \cap UNION {(Nat \cap {2, 1, 3}), (2 .. 0)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02080 failed.
    TLC encountered a non-enumerable quantifier bound
    <<7, 1>>.
    line 14, col 45 to line 14, col 52 of module random_02080
---*)
