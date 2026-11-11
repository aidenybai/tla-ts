(*---
description: Evaluates a random bool expression, seed 262, number 1665.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01665 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CASE (TRUE => FALSE) -> IF FALSE THEN 7 ELSE 7 [] OTHER -> CASE FALSE -> 2147483647 [] OTHER -> 7 < {b2656 \in ({} \cup {x \in 1..3 : x > 1}) : (FALSE \/ FALSE)}) <=> ({b2657 \in UNION {2..1, {1}} : (b2657 \in SUBSET {1})} \subseteq {IF TRUE THEN 1 ELSE 7 : b2658 \in [[x \in Nat |-> x + 1] EXCEPT ![3] = 1]})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01665 failed.
    2266:0 The second argument of < should be an integer, but instead it is:
    {}
---*)
