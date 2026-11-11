(*---
description: Evaluates a random seq expression, seed 262, number 3981.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03981 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(SubSeq(Tail(Append(<<>>, [a |-> 1])), [a |-> CASE TRUE -> 3 [] OTHER -> 2, b |-> (2..1 \subseteq 2..1)], (CHOOSE b6257 \in Len(<<1>>) : (\E b6258 \in {2, 1, 3} : FALSE))), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03981 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 130 to line 14, col 191 of module random_03981
---*)
