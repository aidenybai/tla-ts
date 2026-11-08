(*---
description: Evaluates a random int expression, seed 262, number 4958.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04958 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b7714 \in {b7715 \in {b7716 \in Tail(2147483647) : (FALSE /\ FALSE)} : ((3 < 2) => (~FALSE))} : (((1 + 1) + (7 * 7)) = (CHOOSE b7717 \in (2..1 \subseteq {1, 2}) : (\A b7718 \in {2, 1, 3} : FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04958 failed.
    2283:0 The argument of Tail should be a sequence, but instead it is:
    2147483647
---*)
