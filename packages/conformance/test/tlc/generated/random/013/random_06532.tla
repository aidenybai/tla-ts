(*---
description: Evaluates a random set expression, seed 262, number 6532.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06532 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[Append(<<1>>, [x \in 1..2 |-> x]) EXCEPT !.a = @ + Head(<<1, 2>>)] EXCEPT !.a = (CHOOSE b10037 \in ({2, 1, 3} \ [x \in 1..2 |-> x]) : (2..1 = {}))] \cup UNION {UNION {[[a |-> 1] EXCEPT !.a = 0], DOMAIN <<5, 6>>}, (LET b10038 == 1..3 IN b10038 .. (2147483647 % 7))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06532 failed.
    Attempted to access tuple at a non integral index: "a"
---*)
