(*---
description: Evaluates a random bool expression, seed 262, number 4526.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04526 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(Append([<<1, 2>> EXCEPT ![1] = 2147483647], ([a |-> 1, b |-> TRUE]).a)) \in (IF (7 = 0) THEN (3 + 0) ELSE Len(<<>>) .. CASE ({} \ 2..1) -> Head(<<>>) [] OTHER -> (<<>> = [x \in 1..2 |-> x]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04526 failed.
    A non-boolean expression (a set of the form {e1, ... ,eN}) was used as a condition of a CASE. line 14, col 147 to line 14, col 155 of module random_04526
---*)
