(*---
description: Evaluates a random record expression, seed 262, number 1256.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01256 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> {(0 - 3), (1 + 2147483647)}, b |-> ((CHOOSE b2005 \in Nat : FALSE) = (3 - 2147483647))] EXCEPT !.a = @ + Head([<<2, 7>> EXCEPT ![1] = CASE TRUE -> 3 [] OTHER -> 3])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01256 failed.
    2178:0 Overflow when computing 1+2147483647
---*)
