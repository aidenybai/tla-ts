(*---
description: Evaluates a random bool expression, seed 262, number 8964.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08964 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b13899 \in UNION {(3 % 7), {b13900 \in Nat : TRUE}} |-> (Len(<<>>) + (\A b13901 \in {1} : FALSE))] \in UNION {({b13902 \in {2, 1, 3} : TRUE} \cap {{1} : b13903 \in 2..1}), {CASE 3 -> 2147483647 [] OTHER -> 2, (-1 % 1)}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08964 failed.
    A non-boolean expression (an integer) was used as a condition of a CASE. 3
---*)
