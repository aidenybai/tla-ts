(*---
description: Evaluates a random bool expression, seed 262, number 857.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00857 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> (-([a |-> 1]).a), b |-> ({b1395 \in SUBSET {1} : FALSE} \subseteq DOMAIN (1 :> 2))] = [[a |-> Cardinality(SUBSET {1}), b |-> (<<5, 6>> => FALSE)] EXCEPT !.a = (([x \in Nat |-> x + 1])[3] \div Head(<<1, 2>>))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00857 failed.
    Attempted to evaluate an expression of form P => Q when P was
    a tuple.
    line 14, col 150 to line 14, col 166 of module random_00857
---*)
