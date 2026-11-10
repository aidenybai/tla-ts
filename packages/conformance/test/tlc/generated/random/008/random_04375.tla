(*---
description: Evaluates a random bool expression, seed 262, number 4375.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04375 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((IF FALSE THEN 1 ELSE 2 \in UNION {1..3, {2, 1, 3}}) /\ Tail(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q))) <=> (((-7) % (2..1 + 1)) \in (CHOOSE f \in [{2, 1, 3} -> 2..1] : TRUE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04375 failed.
    Attempted to evaluate an expression of form P /\ Q when Q was
    a tuple.
    line 14, col 18 to line 14, col 120 of module random_04375
---*)
