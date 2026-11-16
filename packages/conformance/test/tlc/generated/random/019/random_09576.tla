(*---
description: Evaluates a random seq expression, seed 262, number 9576.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09576 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<([(CHOOSE r \in [a : {0} \cup {1}] : TRUE) EXCEPT !.a = CASE TRUE -> -1 [] OTHER -> 1]).a, (IF ({2, 1, 3} = Nat) THEN (7 \div 2) ELSE ([a |-> 1, b |-> TRUE]).a :> CASE (SUBSET {1} \subseteq {x \in 1..3 : x > 1}) -> ([a |-> 1]).a [] OTHER -> ({2, 1, 3} \subseteq {1}))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09576 failed.
    Attempted to check equality of the set {1, 2, 3} with the value:
    Nat
---*)
