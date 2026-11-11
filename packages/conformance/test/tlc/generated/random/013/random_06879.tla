(*---
description: Evaluates a random set expression, seed 262, number 6879.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06879 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((DOMAIN ((3 \div 2147483647) :> (2 % 3)) \ {Len(SelectSeq(<<1, 2>>, LAMBDA e : e > 0)), ({b10546 \in TRUE : TRUE} \cup (3 .. 2147483647))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06879 failed.
    Attempted to enumerate { x \in S : p(x) } when S:
    TRUE
    is not enumerable
---*)
