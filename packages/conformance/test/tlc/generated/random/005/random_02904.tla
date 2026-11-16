(*---
description: Evaluates a random record expression, seed 262, number 2904.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02904 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (IF <<[a |-> 1, b |-> TRUE], 2>> THEN ([x \in 1..2 |-> x])[2147483647] ELSE (-7) % Len(<<-1, 7>>)), b |-> (([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2147483647] = (1..3 \cap {1, 2})) \/ (IF FALSE THEN 7 ELSE 7 < (2147483647 * 3)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02904 failed.
    A non-boolean expression (a tuple) was used as the condition of an IF.
    line 14, col 24 to line 14, col 119 of module random_02904
---*)
