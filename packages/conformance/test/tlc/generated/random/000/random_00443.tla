(*---
description: Evaluates a random function expression, seed 262, number 443.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00443 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[[a |-> 1, b |-> TRUE] EXCEPT !.a = 2] EXCEPT !.a = @ + (2147483647 - 2147483647)] EXCEPT !.a = {(0 - b722) : b722 \in (1 .. 7)}] EXCEPT !.a = (CHOOSE b723 \in ((0 .. 3) \cap IF FALSE THEN 2 ELSE 2147483647) : (\E b724 \in ({} \cup {x \in 1..3 : x > 1}) : (TRUE <=> TRUE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00443 failed.
    Attempted to check if the value:
    0
    is an element of the integer 2147483647
---*)
