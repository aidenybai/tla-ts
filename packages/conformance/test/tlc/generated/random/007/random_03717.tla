(*---
description: Evaluates a random int expression, seed 262, number 3717.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03717 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE ((\E b5874 \in (7 .. 2147483647) : (2..1 = Nat)) \/ (Append(<<3, 1, 2>>, 2) = [[x \in 1..2 |-> x] EXCEPT ![3] = 2147483647])) -> (-(Cardinality({x \in 1..3 : x > 1}) + Head(<<1>>))) [] OTHER -> Len(Append((<<1, 2>> \o <<>>), Cardinality({1, 2}))))
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    1001:1 Java ran out of memory.  Running Java with a larger memory allocation
    pool (heap) may fix this.  But it won't help if some state has an enormous
    number of successor states, or if TLC must compute the value of a huge set.
---*)
