(*---
description: Evaluates a random seq expression, seed 262, number 1181.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01181 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq([[(CHOOSE r \in [a : 1..2] : TRUE) EXCEPT !.a = @ + (7 * 3)] EXCEPT !.a = CASE (~TRUE) -> (3 + 2147483647) [] OTHER -> ([a |-> 1]).a], LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01181 failed.
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    [a |-> 1]
---*)
