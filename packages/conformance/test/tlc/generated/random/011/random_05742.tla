(*---
description: Evaluates a random record expression, seed 262, number 5742.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05742 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> IF ({1, 2} = {}) THEN (-1 + [x \in Nat |-> x + 1]) ELSE (0 < 2), b |-> (\E b8845 \in (2..1 \cap 1..3) : (TRUE => TRUE))] EXCEPT !.a = (<<(<<5, 6>>)[-1], Cardinality({})>>).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05742 failed.
    Attempted to access index -1 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
