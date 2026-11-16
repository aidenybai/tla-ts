(*---
description: Evaluates a random int expression, seed 262, number 7566.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07566 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b11648 \in (({1} \cap {}) \cup ({1} \cup {1, 2})) : (\E b11649 \in (CHOOSE f \in [{} -> {1}] : TRUE) : DOMAIN <<5, 6>>)) - (CASE (3 < 2) -> ([a |-> 1]).a [] OTHER -> IF TRUE THEN 7 ELSE 2 % ((0 % 3) - (-1 \div [a |-> 1])))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07566 failed.
    TLC encountered a non-enumerable quantifier bound
    <<>>.
    line 14, col 93 to line 14, col 123 of module random_07566
---*)
