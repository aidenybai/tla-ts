(*---
description: Evaluates a random seq expression, seed 262, number 5030.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05030 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(SubSeq([<<1>> EXCEPT ![1] = 1], CASE TRUE -> 2147483647 [] OTHER -> 2147483647, Cardinality(Nat))) - LET b7821 == (CHOOSE b7822 \in UNION {Nat, 1..3} : ((1 :> 2) @@ [x \in 1..2 |-> x])) IN Cardinality(UNION {{x \in 1..3 : x > 1}, 2..1})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05030 failed.
    2181:0 Attempted to compute cardinality of the value
    Nat
---*)
