(*---
description: Evaluates a random seq expression, seed 262, number 7393.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07393 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(SubSeq(([<<1, 2>> EXCEPT ![1] = 7] \o SubSeq(<<1, 2>>, 2, -1)), ((2147483647 % 0) * ((1 :> 2))[2]), IF (TRUE => FALSE) THEN (CHOOSE b11382 \in Nat : [a |-> 1]) ELSE LET b11383 == 3 IN 1), ((([x \in 1..2 |-> x])[1] % Len(<<1>>)) * (CHOOSE f \in [{2, 1, 3} -> 1..2] : TRUE)), IF (([x \in Nat |-> x + 1] \cup {1}) \subseteq (Nat \cup 1..3)) THEN [[[a |-> 1] EXCEPT !.a = 0] EXCEPT !.a = @ + IF TRUE THEN 0 ELSE 2147483647] ELSE ((0 \div 3) - Head(<<5, 6>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
