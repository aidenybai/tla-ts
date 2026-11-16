(*---
description: Evaluates a random function expression, seed 262, number 6977.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06977 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {({b10679 : b10679 \in 2..1} \cup {b10680 \in {1} : TRUE}), DOMAIN [b10681 \in 2..1 |-> <<5, 6>>]} \cap (({b10682 \in {x \in 1..3 : x > 1} : <<1>>} \cup ({} \ 1..3)) \cap UNION {{2, 1}, (1..3 \ SUBSET {1})})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06977 failed.
    Attempted to evaluate an expression of form {x \in S : P(x)} when P was a tuple.
    line 14, col 164 to line 14, col 168 of module random_06977
---*)
