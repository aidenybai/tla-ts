(*---
description: Evaluates a random bool expression, seed 262, number 615.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00615 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b1033 \in ({Head(<<3, 1, 2>>), IF FALSE THEN 2147483647 ELSE -1} \cap {([x \in Nat |-> x + 1])[-1], Len(<<>>)}) |-> (IF (FALSE /\ TRUE) THEN (-b1033) ELSE (-1 \div 2147483647) - (([a |-> 1]).a :> (-1 % 1)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00615 failed.
    In applying the function
    [x \in Nat |-> <expression line 14, col 104 to line 14, col 108 of module random_00615>],
    the first argument is:
    -1
    which is not in its domain.
---*)
