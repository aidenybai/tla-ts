(*---
description: Evaluates a random bool expression, seed 262, number 551.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00551 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((CHOOSE r \in [a : {1, 2} \ {1}] : TRUE)).a - Len(SubSeq(<<3, 1, 2>>, 1, 0))) \in (UNION {(1..3 \/ TRUE), {b937 \in Nat : FALSE}} \cap {LET b938 == 1 IN b938, (7 * 1)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00551 failed.
    Attempted to evaluate an expression of form P \/ Q when P was
    a set of the form i..j.
    line 14, col 110 to line 14, col 121 of module random_00551
---*)
