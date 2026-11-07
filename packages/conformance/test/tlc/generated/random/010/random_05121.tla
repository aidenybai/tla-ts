(*---
description: Evaluates a random function expression, seed 262, number 5121.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05121 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[b7963 \in (Nat \ {x \in 1..3 : x > 1}) |-> ([a |-> 1, b |-> TRUE]).a] EXCEPT ![IF (\A b7964 \in {2, 1, 3} : FALSE) THEN (3 \div 7) ELSE (3 - 3)] = LET b7965 == CASE FALSE -> 2 [] OTHER -> 0 IN ([a |-> 1]).a] EXCEPT ![Head(<<Len(1..3), Head(<<1>>)>>)] = IF ((\A b7966 \in <<>> : TRUE) /\ (<<3, 1, 2>> = [x \in Nat |-> x + 1])) THEN ((3 % FALSE) % (-0)) ELSE (IF FALSE THEN 2147483647 ELSE 2 \div (2147483647 - 2147483647))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Len should be a sequence, but instead it is:
    1..3
    2283:0 The argument of Len should be a sequence, but instead it is:
    1..3
---*)
