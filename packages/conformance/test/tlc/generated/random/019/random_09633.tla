(*---
description: Evaluates a random function expression, seed 262, number 9633.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09633 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([([x \in 1..2 |-> x] @@ (1 :> 2)) EXCEPT ![(2 * 2147483647)] = Len([a |-> 1])] @@ [b14956 \in (SUBSET {1} \cap Nat) |-> CASE TRUE -> 0 [] OTHER -> <<3, 1, 2>>]) @@ [[a |-> Cardinality(Nat), b |-> (2 <=> TRUE)] EXCEPT !.a = @ + Head((<<3, 1, 2>> \o <<>>))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2*2147483647
    2178:0 Overflow when computing 2*2147483647
---*)
