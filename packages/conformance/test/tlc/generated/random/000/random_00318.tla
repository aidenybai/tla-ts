(*---
description: Evaluates a random bool expression, seed 262, number 318.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00318 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b528 \in {((b529 + 0) * CASE TRUE -> 1 [] OTHER -> 7) : b529 \in ((Nat \cup {1}) \ {b530 \in {1} : FALSE})} : (({2147483647 : b531 \in {1}} = {b528 : b532 \in {x \in 1..3 : x > 1}}) \/ ((b528 \in 1..3) => ([a |-> 1, b |-> TRUE] = [a |-> 1])))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00318 failed.
    Attempted to enumerate S \cup T when S:
    {1}
    and T:
    Nat
    are not both enumerable
---*)
