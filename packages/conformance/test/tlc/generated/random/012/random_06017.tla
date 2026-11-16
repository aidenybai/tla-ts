(*---
description: Evaluates a random function expression, seed 262, number 6017.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06017 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b9268 \in ({IF FALSE THEN b9269 ELSE b9269 : b9269 \in (2..1 \ Nat)} \cup {([x \in 1..2 |-> x])[7], LET b9270 == 0 IN b9270}) |-> Cardinality((UNION {TRUE, {1, 2}} \cup {b9271 \in {1, 2} : TRUE}))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06017 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    7
    which is not in its domain.
---*)
