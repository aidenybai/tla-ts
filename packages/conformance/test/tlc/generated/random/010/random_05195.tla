(*---
description: Evaluates a random bool expression, seed 262, number 5195.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05195 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((CHOOSE r \in [a : {1}] : TRUE)).a % IF [[a |-> 1] EXCEPT !.a = @ + 7] THEN Head(<<>>) ELSE Len(<<1>>)) \in UNION {{Len(<<1>>) : b8057 \in (2147483647 .. 7)}, {Head(<<1>>) : b8058 \in ({x \in 1..3 : x > 1} \ 1..3)}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05195 failed.
    A non-boolean expression (a record) was used as the condition of an IF.
    line 14, col 56 to line 14, col 120 of module random_05195
---*)
