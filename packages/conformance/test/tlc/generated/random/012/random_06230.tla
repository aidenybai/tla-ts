(*---
description: Evaluates a random record expression, seed 262, number 6230.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06230 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE r \in [a : {0} \cup {1}] : TRUE) EXCEPT !.a = @ + Cardinality(DOMAIN [x \in Nat |-> x + 1])] EXCEPT !.a = IF ((2147483647 - 7) :> (<<1>>)[3]) THEN (CHOOSE b9589 \in (7 .. 7) : (FALSE => TRUE)) ELSE Head(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06230 failed.
    2181:0 Attempted to compute cardinality of the value
    Nat
---*)
