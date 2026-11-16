(*---
description: Evaluates a random seq expression, seed 262, number 8717.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08717 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(SubSeq(Append(SelectSeq([a |-> 1, b |-> TRUE], LAMBDA e : e > 0), (-1 % 3)), LET b13497 == (2 + -1) IN (b13497 % 0), [(<<3, 1, 2>> @@ [x \in Nat |-> x + 1]) EXCEPT ![(3 * 2147483647)] = CASE FALSE -> -1 [] OTHER -> -1]), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08717 failed.
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    [a |-> 1, b |-> TRUE]
---*)
