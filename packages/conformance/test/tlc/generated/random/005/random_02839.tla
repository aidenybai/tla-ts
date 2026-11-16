(*---
description: Evaluates a random seq expression, seed 262, number 2839.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02839 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(Append(SortSeq(SubSeq(<<3, 1, 2>>, -1, 2), LAMBDA p, q : p < q), Len(Tail(<<>>))), (CHOOSE b4505 \in UNION {DOMAIN [x \in Nat |-> x + 1], CASE TRUE -> 2147483647 [] OTHER -> -1} : ([[a |-> 1] EXCEPT !.a = b4505] = [[a |-> 1] EXCEPT !.a = 1]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02839 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<3, 1, 2>>
    , but instead it is
    -1
---*)
