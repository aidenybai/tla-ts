(*---
description: Evaluates a random bool expression, seed 262, number 5991.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05991 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Append(SubSeq(<<1>>, 3, TRUE), CASE FALSE -> 2147483647 [] OTHER -> 2) = [b9233 \in UNION {{2, 1, 3}, {}} |-> (b9233 :> 0)]) \/ (UNION {{b9234 \in 2..1 : TRUE}, DOMAIN [x \in Nat |-> x + 1]} = [[[a |-> 1] EXCEPT !.a = @ + 7] EXCEPT !.a = @ + ({1} = Nat)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05991 failed.
    2169:0 The third argument of SubSeq should be a natural number, but instead it is:
    TRUE
---*)
