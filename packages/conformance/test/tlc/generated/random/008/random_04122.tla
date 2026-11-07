(*---
description: Evaluates a random seq expression, seed 262, number 4122.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04122 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(Append(SubSeq(Tail(<<1, 2>>), (3 % -1), (-1 - 7)), ([<<5, 6>> EXCEPT ![-1] = 7] @@ [[x \in Nat |-> x + 1] EXCEPT ![[x \in Nat |-> x + 1]] = (1 :> 2)]))))
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
