(*---
description: Evaluates a random seq expression, seed 262, number 9131.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09131 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SortSeq(Append(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0), (3 * 2147483647)), LAMBDA p, q : p < q) EXCEPT ![1] = LET b14179 == ([<<5, 6>> EXCEPT ![1] = 7] % IF TRUE THEN 2 ELSE 1) IN CASE (2147483647 \in {}) -> Len(<<>>) [] OTHER -> (b14179 + b14179)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09131 failed.
    2178:0 Overflow when computing 3*2147483647
---*)
