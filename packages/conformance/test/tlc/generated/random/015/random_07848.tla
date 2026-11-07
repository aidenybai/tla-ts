(*---
description: Evaluates a random function expression, seed 262, number 7848.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07848 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE f \in [{1, 2} \cap {2} -> {1}] : TRUE) EXCEPT ![([[a |-> 1, b |-> TRUE] EXCEPT !.a = 2]).a] = (CHOOSE b12124 \in DOMAIN (1 :> 2) : (~FALSE))] EXCEPT ![((CHOOSE b12125 \in ({1} \ SUBSET {1}) : (Nat = {1})) \div (CHOOSE b12126 \in ({x \in 1..3 : x > 1} \ FALSE) : (FALSE /\ TRUE)))] = (((7 % 2147483647) * ([a |-> 1, b |-> TRUE]).a) * ((0 :> 2147483647))[(CHOOSE b12127 \in Nat : FALSE)])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07848 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
