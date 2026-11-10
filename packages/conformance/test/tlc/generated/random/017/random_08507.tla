(*---
description: Evaluates a random function expression, seed 262, number 8507.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08507 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[b13176 \in DOMAIN ([x \in 1..2 |-> x] @@ (1 :> 2)) |-> ((b13176 + b13176) * (0 \div b13176))] EXCEPT ![((CHOOSE b13177 \in {0, 1} : ([a |-> 1] = [a |-> 1])) \div (CHOOSE b13178 \in {1, -1} : ({2, 1, 3} = Nat)))] = IF (\A b13179 \in DOMAIN (1 :> 2) : (TRUE /\ TRUE)) THEN Cardinality(({} \cup Nat)) ELSE (({x \in 1..3 : x > 1} \cap Nat) \subseteq {b13180 \in {2, 1, 3} : TRUE})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08507 failed.
    Attempted to check equality of the set {1, 2, 3} with the value:
    Nat
---*)
