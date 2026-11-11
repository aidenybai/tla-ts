(*---
description: Evaluates a random function expression, seed 262, number 6506.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06506 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[((CHOOSE b9998 \in Nat : TRUE) :> (CHOOSE b9999 \in Nat : TRUE)) EXCEPT ![Len(SubSeq(<<3, 1, 2>>, 2147483647, -1))] = (\E b10000 \in {b10001 \in {} : FALSE} : (3 \in Nat))] EXCEPT ![UNION {({b10002 \in 7 : TRUE} \ UNION {1..3, {1}}), (DOMAIN FALSE \cup {2147483647, 2147483647})}] = (-(-(-3)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06506 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 20 to line 14, col 46 of module random_06506
---*)
