(*---
description: Evaluates a random function expression, seed 262, number 911.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00911 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[<<IF FALSE THEN 2147483647 ELSE 2147483647, (CHOOSE r \in [a : {0} \cup {1}] : TRUE)>> EXCEPT ![1] = Len(SubSeq([a |-> 1], 7, TRUE))] EXCEPT !.a = @ + (((CHOOSE b1468 \in {2, 1, 3} : FALSE) % (-1 \div 2)) * ((CHOOSE b1469 \in Nat : TRUE) * (2147483647 + 2147483647)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SubSeq should be a sequence, but instead it is:
    [a |-> 1]
    2169:0 The first argument of SubSeq should be a sequence, but instead it is:
    [a |-> 1]
---*)
