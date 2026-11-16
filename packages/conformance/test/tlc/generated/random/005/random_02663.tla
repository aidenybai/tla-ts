(*---
description: Evaluates a random record expression, seed 262, number 2663.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02663 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[[a |-> 1, b |-> TRUE] EXCEPT !.a = -1] EXCEPT !.a = LET b4199 == 0 IN b4199] EXCEPT !.a = @ + (-(7 \div 2))] EXCEPT !.a = IF ((\E b4200 \in {} : TRUE) \/ (\A b4201 \in 2..1 : FALSE)) THEN (CHOOSE b4202 \in (0 \cap {1}) : (~TRUE)) ELSE IF (<<1, 2>> = [x \in Nat |-> x + 1]) THEN (7 + [a |-> 1]) ELSE ({1, 2}).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02663 failed.
    Attempted to check if the value:
    1
    is an element of the integer 0
---*)
