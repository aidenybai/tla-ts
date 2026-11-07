(*---
description: Evaluates a random seq expression, seed 262, number 1864.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01864 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SubSeq(SortSeq(SortSeq(<<>>, LAMBDA p, q : p < q), LAMBDA p, q : p < q), LET b2940 == (TRUE + 0) IN ([a |-> 1]).a, (IF TRUE THEN 2147483647 ELSE [a |-> 1] \div ([x \in Nat |-> x + 1])[1])) EXCEPT ![1] = ((CHOOSE f \in [{0} \cup {1} -> 1..2] : TRUE))[(CASE TRUE -> 3 [] OTHER -> 2 - (-[x \in 1..2 |-> x]))]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<>>
    , but instead it is
    1
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<>>
    , but instead it is
    1
---*)
