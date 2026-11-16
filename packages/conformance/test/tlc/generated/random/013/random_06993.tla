(*---
description: Evaluates a random record expression, seed 262, number 6993.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06993 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> Cardinality(({1} \cup {1, 2})), b |-> (\E b10710 \in {7 : b10711 \in {1}} : (Nat = {}))] EXCEPT !.a = ((LET b10712 == 7 IN b10712 \div LET b10713 == 3 IN 0) % ((-1 * 0) % Len(<<>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06993 failed.
    Attempted to compare overridden value Nat with non-overridden value:
    {}
---*)
