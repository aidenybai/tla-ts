(*---
description: Evaluates a random seq expression, seed 262, number 9941.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09941 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SelectSeq({IF <<1, 2>> THEN 2 ELSE {x \in 1..3 : x > 1}, CASE FALSE -> 2 [] OTHER -> 2}, LAMBDA e : e > 0), CASE (([a |-> 1] = [a |-> 1]) <=> ({} = {2, 1, 3})) -> ([[x \in Nat |-> x + 1] EXCEPT ![0] = 0])[Cardinality({x \in 1..3 : x > 1})] [] OTHER -> ([a |-> <<3, 1, 2>>, b |-> FALSE]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09941 failed.
    A non-boolean expression (a tuple) was used as the condition of an IF.
    line 14, col 34 to line 14, col 77 of module random_09941
---*)
