(*---
description: Evaluates a random int expression, seed 262, number 9252.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09252 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b14362 == (CHOOSE b14363 \in (UNION {{1}, 1..3} \cup UNION {Nat, {2, 1, 3}}) : ((TRUE <=> FALSE) <=> (TRUE => TRUE))) IN (((7 % 3) - (b14362 + b14362)) * ([[a |-> 1] EXCEPT !.a = @ + 7]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09252 failed.
    Attempted to compare the set {1, 2, 3} with the value:
    Nat
---*)
