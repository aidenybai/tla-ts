(*---
description: Evaluates a random record expression, seed 262, number 8078.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08078 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[([a |-> 7, b |-> FALSE]).a EXCEPT !.a = @ + LET b12485 == (-0) IN ([a |-> 1, b |-> TRUE]).a] EXCEPT !.a = @ + (Cardinality(({} \ Nat)) * ((CHOOSE b12486 \in {2, 1, 3} : TRUE) \div (7 + 0)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08078 failed.
    Attempted to apply EXCEPT construct to the value 7.
---*)
