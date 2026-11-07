(*---
description: Evaluates a random function expression, seed 262, number 7810.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07810 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(((3 % -1) :> Len(<<1>>)) @@ (CASE TRUE -> 7 [] OTHER -> 2 - Len(<<1, 2>>))) EXCEPT ![IF (~(<<1>> = <<5, 6>>)) THEN (CASE TRUE -> 2147483647 [] OTHER -> -1 % LET b12052 == 2147483647 IN b12052) ELSE (CHOOSE b12053 \in {FALSE, 1} : ({1} = {x \in 1..3 : x > 1}))] = ([[a |-> -1, b |-> TRUE] EXCEPT !.a = CASE FALSE -> 0 [] OTHER -> 0]).a])
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
