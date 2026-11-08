(*---
description: Evaluates a random function expression, seed 262, number 6974.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06974 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(Len(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q)) :> LET b10669 == (7 * 2147483647) IN CASE b10669 -> 2147483647 [] OTHER -> 0) EXCEPT ![(((SUBSET {1} \cap {2, 1, 3}) \subseteq {b10670 \in {1} : FALSE}))[(((1 :> 2))[7] % CASE FALSE -> 7 [] OTHER -> 1)]] = LET b10671 == LET b10672 == (<<5, 6>>)[-1] IN Len(<<1, 2>>) IN ((b10671 - b10671) - (b10671 % {x \in 1..3 : x > 1}))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06974 failed.
    2178:0 Overflow when computing 7*2147483647
---*)
