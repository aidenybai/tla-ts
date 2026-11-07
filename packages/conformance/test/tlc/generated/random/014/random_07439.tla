(*---
description: Evaluates a random record expression, seed 262, number 7439.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07439 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> IF ((\A b11470 \in {} : TRUE) => (<<1>> \/ FALSE)) THEN ((CHOOSE f \in [1..2 -> {1}] : TRUE))[(-2147483647)] ELSE ([[a |-> 1] EXCEPT !.a = 3] % IF TRUE THEN 2 ELSE 3), b |-> (~((Nat \subseteq 2..1) <=> (TRUE => <<1, 2>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07439 failed.
    Attempted to evaluate an expression of form P \/ Q when P was
    a tuple.
    line 14, col 57 to line 14, col 70 of module random_07439
---*)
