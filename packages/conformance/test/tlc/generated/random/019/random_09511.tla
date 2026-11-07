(*---
description: Evaluates a random bool expression, seed 262, number 9511.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09511 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((DOMAIN ([b14770 \in {x \in 1..3 : x > 1} |-> 7] @@ (-1 :> 0)) \subseteq ((CASE FALSE -> 2 [] OTHER -> 0 .. Cardinality(Nat)) \cup ([[x \in 1..2 |-> x] EXCEPT ![-1] = -1] .. ([x \in 1..2 |-> x])[0]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2181:0 Attempted to compute cardinality of the value
    Nat
    2181:0 Attempted to compute cardinality of the value
    Nat
---*)
