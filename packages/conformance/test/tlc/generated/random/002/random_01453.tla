(*---
description: Evaluates a random record expression, seed 262, number 1453.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01453 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ([a |-> CASE TRUE -> 2 [] OTHER -> 2147483647, b |-> (1 < 0)]).a, b |-> ((({1, 2} \cup Nat) \subseteq ({2, 1, 3} \cup {2, 1, 3})) /\ (Tail(<<1, 2>>) = (1 :> -1)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01453 failed.
    Attempted to enumerate S \cup T when S:
    {1, 2}
    and T:
    Nat
    are not both enumerable
---*)
