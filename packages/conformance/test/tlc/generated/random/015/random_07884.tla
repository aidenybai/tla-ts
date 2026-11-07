(*---
description: Evaluates a random set expression, seed 262, number 7884.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07884 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({CASE ((CHOOSE r \in [a : {1, 2}] : TRUE) = [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2147483647]) -> ((2 :> 2))[Len(<<3, 1, 2>>)] [] OTHER -> LET b12172 == LET b12173 == -1 IN [a |-> 1] IN Cardinality({2, 1, 3}), (([a |-> 1, b |-> [a |-> 1]]).a + (IF FALSE THEN 2147483647 ELSE 0 * (-[x \in 1..2 |-> x])))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 1+2147483647
    2178:0 Overflow when computing 1+2147483647
---*)
