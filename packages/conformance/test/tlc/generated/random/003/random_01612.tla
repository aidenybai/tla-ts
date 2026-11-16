(*---
description: Evaluates a random set expression, seed 262, number 1612.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01612 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((IF (\E b2571 \in 3 : FALSE) THEN ([a |-> 1]).a ELSE ([a |-> 1]).a \div [Tail(FALSE) EXCEPT ![1] = (3 \div 1)]) .. ([b2572 \in (<<1>> \cup SUBSET {1}) |-> ([a |-> 1]).a])[(Len(<<>>) \div (2147483647 % 7))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01612 failed.
    TLC encountered a non-enumerable quantifier bound
    3.
    3
---*)
