(*---
description: Evaluates a random int expression, seed 262, number 6237.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06237 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({((b9599 % 0) - Len(<<3, 1, 2>>)) : b9599 \in (({x \in 1..3 : x > 1} \cup {x \in 1..3 : x > 1}) \cup {b9600 \in Nat : TRUE})} \div (([a |-> 7, b |-> FALSE]).a * CASE (3 < 7) -> (CHOOSE b9601 \in SUBSET {1} : TRUE) [] OTHER -> CASE FALSE -> 2 [] OTHER -> 3)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06237 failed.
    Attempted to enumerate { x \in S : p(x) } when S:
    Nat
    is not enumerable
---*)
