(*---
description: Evaluates a random bool expression, seed 262, number 4652.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04652 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((Len(<<>>) \subseteq {2147483647, -1}) /\ ((2147483647 \in {}) \/ ({2, 1, 3} = Nat))) /\ ([Append(<<1, 2>>, -1) EXCEPT !.a = (-1 \div 0)] = [(CHOOSE r \in [a : {2, 1, 3}] : TRUE) EXCEPT !.a = IF FALSE THEN 2 ELSE 0])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04652 failed.
    Attempted to evaluate an expression of form S \subseteq T, but S was not enumerable.
    line 14, col 19 to line 14, col 54 of module random_04652
---*)
