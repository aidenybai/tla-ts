(*---
description: Evaluates a random seq expression, seed 262, number 8261.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08261 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(Tail(Append(<<-1, 2147483647>>, (CHOOSE b12795 \in {x \in 1..3 : x > 1} : TRUE))), ((Head(<<1, 2>>) + ([a |-> 1]).a) \div (-(-0))), Head([Tail(<<3, 1, 2>>) EXCEPT ![1] = (CHOOSE f \in [{1, 2} \cap {2} -> {0} \cup {1}] : TRUE)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08261 failed.
    2179:0 The second argument of \div is 0.
---*)
