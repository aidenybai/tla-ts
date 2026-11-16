(*---
description: Evaluates a random int expression, seed 262, number 9804.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09804 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE ((CHOOSE b15210 \in [a |-> 1, b |-> TRUE] : (FALSE = b15210)) = (([a |-> 1, b |-> TRUE]).a \div ([a |-> 1]).a)) -> IF ([<<>> EXCEPT ![1] = 3] = (CHOOSE f \in [{} -> 2..1] : TRUE)) THEN (CHOOSE b15211 \in {b15212 \in {x \in 1..3 : x > 1} : TRUE} : ({2, 1, 3} \subseteq SUBSET {1})) ELSE ([b15213 \in 2..1 |-> b15213])[(-1 - 7)] [] OTHER -> Head(Append(Tail(<<1, 2>>), (-1 % 0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09804 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 23 to line 14, col 80 of module random_09804
---*)
