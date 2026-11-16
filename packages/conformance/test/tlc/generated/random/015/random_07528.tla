(*---
description: Evaluates a random int expression, seed 262, number 7528.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07528 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE (CASE Tail(<<1>>) -> (2 * 7) [] OTHER -> (-0) = (Cardinality({1, 2}) % (3 \div 2))) -> (LET b11601 == (-2147483647) IN (2147483647 * (1 :> 2)) - Head(Tail(<<3, 1, 2>>))) [] OTHER -> ((-Len(<<>>)) + Cardinality((<<1, 2>> = [x \in Nat |-> x + 1]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07528 failed.
    A non-boolean expression (a tuple) was used as a condition of a CASE. line 14, col 27 to line 14, col 37 of module random_07528
---*)
