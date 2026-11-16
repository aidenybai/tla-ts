(*---
description: Evaluates a random function expression, seed 262, number 3854.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03854 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b6070 \in {CASE (\A b6072 \in Nat : TRUE) -> (b6071 % 1) [] OTHER -> LET b6073 == -1 IN TRUE : b6071 \in ((2..1 \cup SUBSET {1}) \cup DOMAIN [x \in 1..2 |-> x])} |-> ((({1, 2} = {1, 2}) + (b6070 % -1)) - ([[a |-> 1] EXCEPT !.a = @ + -1]).a)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03854 failed.
    Attempted to compare the set {} with the value:
    2
---*)
