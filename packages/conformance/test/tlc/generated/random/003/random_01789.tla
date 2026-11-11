(*---
description: Evaluates a random seq expression, seed 262, number 1789.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01789 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b2831 == ([b2832 \in ({1, 2} \cup 2..1) |-> (7 * {1, 2})])[((3 % 2) * (-2147483647))] IN (CHOOSE b2833 \in (Tail(<<1>>) .. (3 - b2831)) : (\E b2834 \in ({x \in 1..3 : x > 1} \ {2, 1, 3}) : ({} = {2, 1, 3}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01789 failed.
    In applying the function
    [b2832 \in {1, 2} |-> <expression line 14, col 65 to line 14, col 74 of module random_01789>],
    the first argument is:
    -2147483647
    which is not in its domain.
---*)
