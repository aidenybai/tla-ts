(*---
description: Evaluates a random bool expression, seed 262, number 752.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00752 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((DOMAIN SortSeq(<<>>, LAMBDA p, q : p < q) \subseteq DOMAIN (2147483647 :> 3)) <=> (\A b1234 \in (([a |-> 1, b |-> TRUE] \ 1..3) \cup UNION {Nat, 2..1}) : ([[a |-> 1] EXCEPT !.a = @ + 0] = [[a |-> 1, b |-> TRUE] EXCEPT !.a = b1234]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00752 failed.
    Attempted to enumerate S \ T when S:
    [a |-> 1, b |-> TRUE]
    is not enumerable.
---*)
