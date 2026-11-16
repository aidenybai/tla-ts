(*---
description: Evaluates a random seq expression, seed 262, number 9798.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09798 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(SortSeq(<<(CHOOSE b15202 \in 3 : FALSE), Head(<<1>>)>>, LAMBDA p, q : p < q), (-((CHOOSE f \in [{1, 2} -> {0} \cup {1}] : TRUE))[CASE FALSE -> 7 [] OTHER -> 3]), CASE (\A b15203 \in (-1 .. 2147483647) : ([a |-> 1] = [a |-> 1])) -> (-(2 + -1)) [] OTHER -> UNION {{b15204 \in {1, 2} : FALSE}, SubSeq(<<1, 2>>, -1, 1)}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09798 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 34 to line 14, col 60 of module random_09798
---*)
