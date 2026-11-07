(*---
description: Evaluates a random record expression, seed 262, number 1682.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01682 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (Len(Tail(<<1, 2>>)) % Len(SubSeq(<<1, 2>>, 3, -1))), b |-> ((\A b2681 \in {2147483647, 7} : (b2681 = b2681)) \/ (CASE TRUE -> 7 [] OTHER -> 3 \in {b2682 \in {2, 1, 3} : FALSE}))])
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
