(*---
description: Evaluates a random bool expression, seed 262, number 3611.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03611 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {{(2 * 7) : b5699 \in (SUBSET {1} \cup Nat)}, DOMAIN (0 :> 2)} \subseteq (CASE (TRUE <=> <<>>) -> ([a |-> 1]).a [] OTHER -> CASE TRUE -> 3 [] OTHER -> 3 .. (DOMAIN [x \in Nat |-> x + 1] \cup {b5700 \in {x \in 1..3 : x > 1} : TRUE}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03611 failed.
    Attempted to enumerate S \cup T when S:
    {{}, {1}}
    and T:
    Nat
    are not both enumerable
---*)
