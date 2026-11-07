(*---
description: Evaluates a random seq expression, seed 262, number 5254.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05254 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq((-([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2147483647]).a), CASE ([a |-> 7, b |-> FALSE] = [[a |-> 1] EXCEPT !.a = @ + 2147483647]) -> Head(Append(<<1, 2>>, -1)) [] OTHER -> CASE (\E b8132 \in 2..1 : TRUE) -> Len(<<>>) [] OTHER -> (0 - 3), (-([[a |-> 1, b |-> TRUE] EXCEPT !.a = 0] % (2147483647 * 1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 1+2147483647
    2178:0 Overflow when computing 1+2147483647
---*)
