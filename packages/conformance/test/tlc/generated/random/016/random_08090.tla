(*---
description: Evaluates a random set expression, seed 262, number 8090.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08090 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b12498 \in {(CHOOSE r \in [a : {0} \cup {1}] : TRUE) : b12499 \in (UNION {{x \in 1..3 : x > 1}, {1}} \cap {7, -1})} : ([a |-> Cardinality(SUBSET {1}), b |-> (2147483647 = -1)] = [[[a |-> 1] EXCEPT !.a = @ + 2147483647] EXCEPT !.a = @ + (b12498 - b12498)])})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
