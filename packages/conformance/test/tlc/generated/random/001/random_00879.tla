(*---
description: Evaluates a random set expression, seed 262, number 879.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00879 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {DOMAIN [[<<5, 6>> EXCEPT ![0] = 3] EXCEPT ![UNION {Nat, Nat}] = Len(<<1>>)], {b1418 \in {(b1419 % b1419) : b1419 \in {b1420 \in {2, 1, 3} : FALSE}} : [(<<5, 6>> @@ [x \in 1..2 |-> x]) EXCEPT ![LET b1421 == b1418 IN 3] = (2147483647 % b1418)]}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 32 to line 14, col 39 of module random_00879
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00879 failed.
    Attempted to enumerate UNION(s), but some element of s is nonenumerable.
---*)
