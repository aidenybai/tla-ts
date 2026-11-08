(*---
description: Evaluates a random seq expression, seed 262, number 1596.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01596 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<((3 * 2) % (7 + 2147483647)), ((CHOOSE r \in [a : {1}] : TRUE)).a>> \o SubSeq(SelectSeq(SubSeq(<<>>, 2147483647, 2), LAMBDA e : e > 0), LET b2550 == (CHOOSE b2551 \in {1} : FALSE) IN ([a |-> 1, b |-> TRUE]).a, LET b2552 == Len(<<1, 2>>) IN ((1 :> 2))[b2552])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01596 failed.
    2178:0 Overflow when computing 7+2147483647
---*)
