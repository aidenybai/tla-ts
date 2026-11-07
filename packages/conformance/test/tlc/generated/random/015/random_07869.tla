(*---
description: Evaluates a random record expression, seed 262, number 7869.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07869 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> LET b12149 == (3 * 7) IN ([x \in Nat |-> x + 1])[b12149], b |-> (DOMAIN <<5, 6>> = {1 : b12150 \in {x \in 1..3 : x > 1}})] EXCEPT !.a = @ + CASE ([FALSE EXCEPT !.a = @ + 2] \in (2..1 \cup {})) -> CASE ({2, 1, 3} \subseteq 2..1) -> LET b12151 == -1 IN b12151 [] OTHER -> (7 - 2) [] OTHER -> ((2 - 0) + Cardinality({1, 2}))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07869 failed.
    Attempted to apply EXCEPT construct to the value FALSE.
---*)
