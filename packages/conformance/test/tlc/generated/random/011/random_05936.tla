(*---
description: Evaluates a random int expression, seed 262, number 5936.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05936 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF (((Nat \ Nat) :> (2147483647 \div 0)) = (([x \in 1..2 |-> x] @@ [x \in 1..2 |-> x]) .. Head(<<1>>))) THEN (CHOOSE b9147 \in {([a |-> 1, b |-> TRUE]).a : b9148 \in ({1, 2} \cap {1, 2})} : (Len(<<>>) < (b9147 % [a |-> 1, b |-> TRUE]))) ELSE (-Cardinality(({x \in 1..3 : x > 1} \cup SUBSET {1}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05936 failed.
    2179:0 The second argument of \div is 0.
---*)
