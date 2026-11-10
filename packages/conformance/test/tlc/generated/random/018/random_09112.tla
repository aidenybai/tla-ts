(*---
description: Evaluates a random set expression, seed 262, number 9112.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09112 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((Append(<<1, 2>>, 3)).a .. Len((CHOOSE b14159 \in {1} : FALSE))) \cup ({(3 % 3), (3 + 2147483647)} \ ({1 : b14160 \in Nat} \ UNION {{x \in 1..3 : x > 1}, 2..1}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09112 failed.
    Attempted to apply function with integer domain to the non-integer argument "a"
---*)
