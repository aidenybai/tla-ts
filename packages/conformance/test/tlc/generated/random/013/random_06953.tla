(*---
description: Evaluates a random seq expression, seed 262, number 6953.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06953 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append((([<<1, 2>> EXCEPT ![1] = 3] \o SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0)) \o SubSeq([<<>> EXCEPT ![1] = -1], Len(<<>>), (7 % -1))), (Head((FALSE \o <<>>)) * (CHOOSE b10636 \in {2147483647, -1} : (\A b10637 \in Nat : <<3, 1, 2>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 108 to line 14, col 111 of module random_06953
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06953 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
---*)
