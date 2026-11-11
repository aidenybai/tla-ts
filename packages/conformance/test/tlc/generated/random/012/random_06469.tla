(*---
description: Evaluates a random function expression, seed 262, number 6469.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06469 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b9961 \in (DOMAIN (2 :> 2147483647) \cup (IF <<3, 1, 2>> THEN 2 ELSE 2 .. (-1 - -1))) |-> ([[a |-> 2, b |-> FALSE] EXCEPT !.a = @ + Cardinality({x \in 1..3 : x > 1})]).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06469 failed.
    A non-boolean expression (a tuple) was used as the condition of an IF.
    line 14, col 59 to line 14, col 99 of module random_06469
---*)
