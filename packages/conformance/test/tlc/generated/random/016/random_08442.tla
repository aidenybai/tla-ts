(*---
description: Evaluates a random bool expression, seed 262, number 8442.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08442 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CASE FALSE -> 2 [] OTHER -> -1 \div ([x \in 1..2 |-> x])[0]) \div ([[a |-> 1] EXCEPT !.a = @ + 3] - (1 - 7))) < LET b13066 == ((CHOOSE b13067 \in [x \in Nat |-> x + 1] : FALSE) % (7 \div 0)) IN Len(SubSeq(<<1>>, b13066, 3))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08442 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    0
    which is not in its domain.
---*)
