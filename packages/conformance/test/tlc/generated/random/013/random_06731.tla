(*---
description: Evaluates a random bool expression, seed 262, number 6731.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06731 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((7 % -1) + (1 \div [x \in Nat |-> x + 1])) * IF (Nat \subseteq 1..3) THEN ([a |-> 1]).a ELSE (-1 + 2147483647)) = IF ((~TRUE) <=> (<<>> = <<5, 6>>)) THEN Len(SortSeq(<<1, 2>>, LAMBDA p, q : p < q)) ELSE ((CHOOSE b10316 \in 1..3 : FALSE) * CASE [a |-> 1] -> 2 [] OTHER -> 3)))
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
