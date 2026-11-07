(*---
description: Evaluates a random bool expression, seed 262, number 9153.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09153 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((LET b14215 == 2147483647 IN b14215 - LET b14216 == 1 IN 3) \in [[a |-> 7, b |-> FALSE] EXCEPT !.a = @ + (7 % -1)]) \/ ((({x \in 1..3 : x > 1} \ 2..1) \ {b14217 \in Nat : FALSE}) \subseteq ({2147483647 : b14218 \in {2, 1, 3}} \cup (2 < 3)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
---*)
