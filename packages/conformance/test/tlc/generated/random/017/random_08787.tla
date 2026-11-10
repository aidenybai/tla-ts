(*---
description: Evaluates a random int expression, seed 262, number 8787.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08787 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CASE FALSE -> 3 [] OTHER -> -1 :> (-7)))[((1 % -1) % [[a |-> 1] EXCEPT !.a = [a |-> 1, b |-> TRUE]])] % Len(SubSeq((<<1>> \o <<3, 1, 2>>), (-1), Head(<<1, 2>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08787 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
---*)
