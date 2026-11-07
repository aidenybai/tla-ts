(*---
description: Evaluates a random function expression, seed 262, number 5574.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05574 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((-1) + LET b8628 == -1 IN b8628) - Len([[a |-> 1] EXCEPT !.a = @ + 2147483647])) :> (CHOOSE b8629 \in {CASE TRUE -> 2 [] OTHER -> 7, [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 0]} : (~(FALSE \subseteq SUBSET {1})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 1+2147483647
    2178:0 Overflow when computing 1+2147483647
---*)
