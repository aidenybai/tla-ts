(*---
description: Evaluates a random record expression, seed 262, number 4585.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04585 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ([[a |-> 7, b |-> FALSE] EXCEPT !.a = @ + IF FALSE THEN 2 ELSE 2147483647]).a, b |-> (\A b7186 \in (IF FALSE THEN 2147483647 ELSE <<1, 2>> .. Len([a |-> 1])) : (({} \subseteq 2..1) \/ (7 < 1)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04585 failed.
    2178:0 Overflow when computing 7+2147483647
---*)
