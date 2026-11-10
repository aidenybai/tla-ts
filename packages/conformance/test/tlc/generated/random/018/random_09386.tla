(*---
description: Evaluates a random set expression, seed 262, number 9386.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09386 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {UNION {(Cardinality(Nat) .. (2 * 2147483647)), (({} \cap {x \in 1..3 : x > 1}) \cap {b14560 : b14560 \in {2, 1, 3}})}, {b14561 \in {(b14562 .. b14562) : b14562 \in ({1, 2} \ {x \in 1..3 : x > 1})} : (\A b14563 \in {2147483647, (1 :> 2)} : (<<3, 1, 2>> = [x \in 1..2 |-> x]))}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09386 failed.
    2181:0 Attempted to compute cardinality of the value
    Nat
---*)
