(*---
description: Evaluates a random bool expression, seed 262, number 4594.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04594 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 0] EXCEPT !.a = @ + (\E b7199 \in [a |-> 1, b |-> TRUE] : TRUE)]).a < (CHOOSE b7200 \in {LET b7201 == 3 IN b7201, Append(<<3, 1, 2>>, -1)} : (\E b7202 \in {2 : b7203 \in 2..1} : (b7200 \in {})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04594 failed.
    TLC encountered a non-enumerable quantifier bound
    [a |-> 1, b |-> TRUE].
    line 14, col 93 to line 14, col 113 of module random_04594
---*)
