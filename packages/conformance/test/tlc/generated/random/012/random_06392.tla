(*---
description: Evaluates a random function expression, seed 262, number 6392.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06392 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b9827 \in ([b9828 \in {1, 2} |-> 0])[Len(<<1, 2>>)] |-> ((b9827 - b9827) * Head(<<>>))] @@ [[(CHOOSE f \in [1..2 -> {0} \cup {1}] : TRUE) EXCEPT ![Cardinality({})] = IF TRUE THEN 3 ELSE 7] EXCEPT ![([b9829 \in {x \in 1..3 : x > 1} |-> 2147483647])[(2 % -1)]] = ([[x \in Nat |-> x + 1] EXCEPT ![3] = 2])[(7 \div 3)]]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 112 to line 14, col 153 of module random_06392
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
---*)
