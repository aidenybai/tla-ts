(*---
description: Evaluates a random function expression, seed 262, number 4562.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04562 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([((-Cardinality({x \in 1..3 : x > 1})) :> (([a |-> 1]).a - LET b7155 == 2147483647 IN 2)) EXCEPT ![IF (~({2, 1, 3} = Nat)) THEN ((CHOOSE r \in [a : {1, 2} \ {1}] : TRUE)).a ELSE IF (2 \in [x \in 1..2 |-> x]) THEN (2 % 0) ELSE Head(<<1, 2>>)] = (CHOOSE b7156 \in (UNION {Nat, Nat} \cap (SUBSET {1} \cup 2..1)) : (\A b7157 \in ({} \cap {}) : (-1 \in {x \in 1..3 : x > 1})))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04562 failed.
    Attempted to check equality of the set {1, 2, 3} with the value:
    Nat
---*)
