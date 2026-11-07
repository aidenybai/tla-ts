(*---
description: Evaluates a random int expression, seed 262, number 9688.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09688 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b15028 \in ({<<1, 2>> : b15029 \in {x \in 1..3 : x > 1}} \ (Nat \ SUBSET {1})) : (~(TRUE \/ TRUE))) - (CHOOSE b15030 \in ((-1 .. 7) \ {-1 : b15031 \in 2..1}) : ([1 EXCEPT !.a = @ + [a |-> 1, b |-> TRUE]] = [[a |-> 1] EXCEPT !.a = @ + b15030]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2158:0 Attempted to check if the value:
    <<1, 2>>
    is an element of Nat.
    2158:0 Attempted to check if the value:
    <<1, 2>>
    is an element of Nat.
---*)
