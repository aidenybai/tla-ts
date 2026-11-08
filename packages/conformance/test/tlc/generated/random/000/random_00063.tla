(*---
description: Evaluates a random seq expression, seed 262, number 63.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00063 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b90 \in ((2147483647 % -1) .. CASE FALSE -> 1 [] OTHER -> 7) |-> {b91 \in {3, b90} : (3 < 3)}] \o Tail(SubSeq(SubSeq(<<>>, 2, -1), ([a |-> 1, b |-> TRUE]).a, (CHOOSE r \in [a : {1, 2}] : TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00063 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
---*)
