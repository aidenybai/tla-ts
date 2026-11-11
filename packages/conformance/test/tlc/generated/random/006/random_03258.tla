(*---
description: Evaluates a random record expression, seed 262, number 3258.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03258 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> ([a |-> [a |-> 1, b |-> TRUE], b |-> FALSE]).a, b |-> ({b5185 : b5185 \in 7} \subseteq ({} \ {2, 1, 3}))] EXCEPT !.a = CASE ((2 * 2147483647) = (7 * 0)) -> IF (\E b5186 \in [a |-> 1, b |-> TRUE] : TRUE) THEN LET b5187 == 1 IN <<>> ELSE Head(<<3, 1, 2>>) [] OTHER -> Head(SortSeq(<<1>>, LAMBDA p, q : p < q))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03258 failed.
    TLC encountered a non-enumerable quantifier bound
    7.
    7
---*)
