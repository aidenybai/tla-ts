(*---
description: Evaluates a random bool expression, seed 262, number 1532.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01532 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Tail(Append(<<3, -1>>, (1 % -1))) \subseteq UNION {({b2434 \in {2, 1, 3} : [a |-> 1]} \cap (1..3 \cap {2, 1, 3})), UNION {{b2435 \in {x \in 1..3 : x > 1} : TRUE}, ({2, 1, 3} \cup 1..3)}}))
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
