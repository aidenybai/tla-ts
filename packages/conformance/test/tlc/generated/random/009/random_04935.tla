(*---
description: Evaluates a random int expression, seed 262, number 4935.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04935 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE ((~({x \in 1..3 : x > 1} = 2..1)) <=> (DOMAIN [x \in Nat |-> x + 1] \subseteq {-1 : b7675 \in {1}})) -> (CHOOSE b7676 \in {Head(<<3, 1, 2>>) : b7677 \in (1..3 \cap Nat)} : (({x \in 1..3 : x > 1} \cap {x \in 1..3 : x > 1}) = {<<5, 6>> : b7678 \in Nat})) [] OTHER -> ((Cardinality({}) :> (CHOOSE b7679 \in {1} : FALSE)))[(-CASE TRUE -> 2147483647 [] OTHER -> 0)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04935 failed.
    Attempted to evaluate an expression of form S \subseteq T, but S was not enumerable.
    line 14, col 60 to line 14, col 118 of module random_04935
---*)
