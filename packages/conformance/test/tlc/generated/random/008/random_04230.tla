(*---
description: Evaluates a random int expression, seed 262, number 4230.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04230 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF ([a |-> Head(<<3, 1, 2>>), b |-> (\E b6649 \in {x \in 1..3 : x > 1} : TRUE)] = [[[a |-> 1] EXCEPT !.a = @ + 2] EXCEPT !.a = (<<5, 6>>)[0]]) THEN (CHOOSE b6650 \in {([a |-> 1, b |-> TRUE]).a, ((1 :> 2))[2]} : (([a |-> 1, b |-> TRUE]).a = Head(<<>>))) ELSE Cardinality({(b6651 - {2, 1, 3}) : b6651 \in {b6652 : b6652 \in {}}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04230 failed.
    Attempted to access index 0 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
