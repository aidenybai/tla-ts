(*---
description: Evaluates a random set expression, seed 262, number 7070.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07070 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({(Len(<<>>) - IF FALSE THEN 1 ELSE 3), ([[a |-> 1] EXCEPT !.a = @ + 2] + (1 + 2147483647))} \cup ({SubSeq(<<>>, -1, 3), IF FALSE THEN 2 ELSE 2147483647} \cup {(-b10860) : b10860 \in {[x \in 1..2 |-> x] : b10861 \in {1}}})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 1+2147483647
    2178:0 Overflow when computing 1+2147483647
---*)
