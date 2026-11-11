(*---
description: Evaluates a random int expression, seed 262, number 169.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00169 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append([Tail(SortSeq(<<1, 2>>, LAMBDA p, q : p < q)) EXCEPT ![1] = (((1 :> 2) \cap Nat) \ (3 .. 3))], (LET b270 == (-1 % 7) IN Len(<<1, 2>>) * ((2147483647 + 1) % LET b271 == 0 IN b271))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00169 failed.
    2178:0 Overflow when computing 2147483647+1
---*)
