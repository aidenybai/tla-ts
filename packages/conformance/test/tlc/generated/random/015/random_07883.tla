(*---
description: Evaluates a random seq expression, seed 262, number 7883.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07883 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SubSeq(SelectSeq(Append(<<1>>, 2147483647), LAMBDA e : e > 0), CASE (\A b12170 \in {x \in 1..3 : x > 1} : FALSE) -> CASE FALSE -> 3 [] OTHER -> 2147483647 [] OTHER -> (CHOOSE b12171 \in Nat : FALSE), (([a |-> 1, b |-> TRUE]).a + ([x \in 1..2 |-> x])[-1])), Len(Tail((<<1>> \o <<3, 1, 2>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07883 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 191 to line 14, col 219 of module random_07883
---*)
