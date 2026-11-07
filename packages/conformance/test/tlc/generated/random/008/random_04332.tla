(*---
description: Evaluates a random set expression, seed 262, number 4332.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04332 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {{DOMAIN [x \in 1..2 |-> x], LET b6823 == 2 IN 2}, {Head(<<3, 1, 2>>) : b6824 \in DOMAIN [x \in 1..2 |-> x]}} \cup {b6825 \in {[[a |-> 1] EXCEPT !.a = @ + 7], SortSeq(<<1, 2>>, LAMBDA p, q : p < q)} : ((CHOOSE r \in [a : {1}] : TRUE) < CASE TRUE -> b6825 [] OTHER -> 7)}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04332 failed.
    Attempted to check equality of the set {1, 2} with the value:
    2
---*)
