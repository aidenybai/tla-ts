(*---
description: Evaluates a random function expression, seed 262, number 2065.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02065 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((-(-1 % 2)) :> CASE <<2147483647, 2>> -> (CHOOSE b3287 \in FALSE : FALSE) [] OTHER -> Len(<<1, 2>>)) @@ ([b3288 \in {0, 0} |-> ([a |-> 1, b |-> TRUE]).a] @@ [Head(<<3, 1, 2>>) EXCEPT ![Len(<<3, 1, 2>>)] = (3 \div 2)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02065 failed.
    A non-boolean expression (a tuple) was used as a condition of a CASE. line 14, col 38 to line 14, col 54 of module random_02065
---*)
