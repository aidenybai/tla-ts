(*---
description: Evaluates a random seq expression, seed 262, number 5833.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05833 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(([[a |-> 3, b |-> TRUE] EXCEPT !.a = Head(<<1, 2>>)] \o UNION {{0, 3}, (CHOOSE b8990 \in Nat : TRUE)}), ((IF FALSE THEN -1 ELSE 2 - (0 % 7)) - ((7 + 1) % [b8991 \in {1, 2} |-> 7]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05833 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 95 to line 14, col 121 of module random_05833
---*)
