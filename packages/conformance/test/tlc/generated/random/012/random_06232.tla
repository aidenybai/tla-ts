(*---
description: Evaluates a random record expression, seed 262, number 6232.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06232 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(DOMAIN ([x \in 1..2 |-> x] @@ [x \in 1..2 |-> x]) \cup DOMAIN {2, -1}) EXCEPT !.a = ((-(-1 * 2)) \div (CHOOSE b9591 \in (7 .. -1) : (b9591 :> [a |-> 1, b |-> TRUE])))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06232 failed.
    Attempted to apply the operator DOMAIN to a non-function
    (a set of the form {e1, ... ,eN})
    line 14, col 73 to line 14, col 86 of module random_06232
---*)
