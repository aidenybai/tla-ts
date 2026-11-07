(*---
description: Evaluates a random function expression, seed 262, number 8192.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08192 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b12667 \in ({2147483647, 7} \ (2 * 2147483647)) |-> ([b12668 \in {2, 1, 3} |-> 2])[LET b12669 == 1 IN b12669]] @@ (((1..3 \cup SUBSET {1}) \div (CHOOSE b12670 \in {1, 2} : FALSE)) :> Len(Append(<<3, 1, 2>>, 2)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2*2147483647
    2178:0 Overflow when computing 2*2147483647
---*)
