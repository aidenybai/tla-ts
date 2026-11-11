(*---
description: Evaluates a random record expression, seed 262, number 965.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00965 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((-1 * 2147483647) = ([a |-> 1, b |-> TRUE]).a) => (Tail(<<>>) = (7 :> 7))) <=> (({1, 7} \cup DOMAIN [x \in Nat |-> x + 1]) \subseteq {b1560 \in [[a |-> 1] EXCEPT !.a = @ + 0] : (FALSE /\ FALSE)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00965 failed.
    Attempted to enumerate S \cup T when S:
    {1, 7}
    and T:
    Nat
    are not both enumerable
---*)
