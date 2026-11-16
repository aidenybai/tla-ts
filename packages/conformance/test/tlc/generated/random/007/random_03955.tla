(*---
description: Evaluates a random function expression, seed 262, number 3955.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03955 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(((2..1 % 7) :> Len(<<>>)) @@ (CHOOSE f \in [2..1 -> {1, 2}] : TRUE)) EXCEPT ![IF (~(2147483647 = -1)) THEN ((CHOOSE r \in [a : {1, 2}] : TRUE)).a ELSE (CASE FALSE -> 0 [] OTHER -> 2147483647 - CASE TRUE -> 7 [] OTHER -> 2147483647)] = ((Head(<<1>>) :> LET b6225 == 2147483647 IN b6225))[([[a |-> 1] EXCEPT !.a = @ + -1]).a]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03955 failed.
    Attempted to check equality of the set {} with the value:
    1
---*)
