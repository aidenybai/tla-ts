(*---
description: Evaluates a random record expression, seed 262, number 8800.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08800 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> IF (-1 \in TRUE) THEN IF FALSE THEN 2147483647 ELSE -1 ELSE (0 + 3), b |-> ((FALSE \/ FALSE) <=> (TRUE <=> TRUE))] EXCEPT !.a = @ + [[[a |-> 2147483647, b |-> <<5, 6>>] EXCEPT !.a = ([x \in 1..2 |-> x])[0]] EXCEPT !.a = @ + (-Len(<<3, 1, 2>>))]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08800 failed.
    Attempted to check if the value:
    -1
    is an element of the boolean TRUE
---*)
