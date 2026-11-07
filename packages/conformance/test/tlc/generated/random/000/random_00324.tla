(*---
description: Evaluates a random set expression, seed 262, number 324.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00324 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((Len(<<>>) % (1 - 7)) \in ([<<5, 6>> EXCEPT !.a = 3] \cup {b544 \in {1} : FALSE})) /\ (((3 .. 0) < Len(<<1>>)) \/ ((7 * 2) < (3 \div <<5, 6>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of % should be a positive number, but instead it is:
    -6
    2169:0 The second argument of % should be a positive number, but instead it is:
    -6
---*)
