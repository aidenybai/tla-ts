(*---
description: Evaluates a random function expression, seed 262, number 8772.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08772 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([(Cardinality([x \in 1..2 |-> x]) :> ([a |-> 1, b |-> TRUE]).a) EXCEPT ![LET b13580 == (CHOOSE b13581 \in 2..1 : TRUE) IN Len(<<3, 1, 2>>)] = ([(1 :> 2) EXCEPT ![7] = 2]).a] @@ ([b13582 \in UNION {{1}, 1..3} |-> CASE FALSE -> 3 [] OTHER -> 2147483647] @@ (CHOOSE b13583 \in UNION {[x \in Nat |-> x + 1], {1}} : (\A b13584 \in 2..1 : FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08772 failed.
    2181:0 Attempted to compute cardinality of the value
    <<1, 2>>
---*)
