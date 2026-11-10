(*---
description: Evaluates a random set expression, seed 262, number 204.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00204 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b334 \in {(CASE TRUE -> 7 [] OTHER -> b335 + (CHOOSE b336 \in 1..3 : TRUE)) : b335 \in ({b337 \in SUBSET {1} : FALSE} \cap (1..3 \cup {1, 2}))} : ([a |-> CASE FALSE -> b334 [] OTHER -> -1, b |-> ([a |-> 1, b |-> TRUE] = [a |-> 1])] = [[[a |-> 1, b |-> TRUE] EXCEPT !.a = b334] EXCEPT !.a = (b334 % 3)])})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00204 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
