(*---
description: Evaluates a random record expression, seed 262, number 5215.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05215 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> IF ({1} \subseteq {1, 2}) THEN (3 % 7) ELSE (-3), b |-> (Append(<<>>, TRUE) = [b8090 \in 2..1 |-> 0])] EXCEPT !.a = [a |-> (Append(<<3, 1, 2>>, 3))[LET b8091 == 2 IN 3], b |-> ((~TRUE) = (2147483647 + 3))]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05215 failed.
    2178:0 Overflow when computing 2147483647+3
---*)
