(*---
description: Evaluates a random record expression, seed 262, number 388.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00388 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2147483647] EXCEPT !.a = @ + CASE TRUE -> -1 [] OTHER -> 3] EXCEPT !.a = [b637 \in ({1, 2} \ {1, 2}) |-> ((1 :> 2))[2]]] EXCEPT !.a = ((CHOOSE r \in [a : {}] : TRUE)).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 1+2147483647
    2178:0 Overflow when computing 1+2147483647
---*)
