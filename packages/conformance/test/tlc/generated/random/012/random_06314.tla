(*---
description: Evaluates a random seq expression, seed 262, number 6314.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06314 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail([SubSeq([<<3, 1, 2>> EXCEPT ![1] = -1], IF <<1, 2>> THEN 7 ELSE 3, ([x \in 1..2 |-> x])[-1]) EXCEPT ![1] = IF (1..3 \subseteq SUBSET {1}) THEN (-1 % -1) ELSE LET b9706 == 2 IN b9706]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06314 failed.
    A non-boolean expression (a tuple) was used as the condition of an IF.
    line 14, col 61 to line 14, col 85 of module random_06314
---*)
