(*---
description: Evaluates a random set expression, seed 262, number 6895.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06895 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({CASE ((-1 < 1) <=> [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + -1]) -> LET b10558 == ([a |-> 1]).a IN (b10558 \div 7) [] OTHER -> (([x \in Nat |-> x + 1] @@ [x \in Nat |-> x + 1]))[IF FALSE THEN 0 ELSE 7], Len(SortSeq(Tail(<<1, 2>>), LAMBDA p, q : p < q))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06895 failed.
    Attempted to evaluate an expression of form P <=> Q when P or Q was not a boolean.
    line 14, col 23 to line 14, col 78 of module random_06895
---*)
