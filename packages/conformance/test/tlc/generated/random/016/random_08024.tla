(*---
description: Evaluates a random seq expression, seed 262, number 8024.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08024 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {{([a |-> b12375, b |-> TRUE]).a : b12375 \in ({b12376 \in Nat : TRUE} = (2..1 \cup 2..1))}, UNION {{CASE FALSE -> 0 [] OTHER -> 7, Append(<<>>, 2)}, (([a |-> 1]).a .. (CHOOSE b12377 \in {1, 2} : FALSE))}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08024 failed.
    Attempted to enumerate { x \in S : p(x) } when S:
    Nat
    is not enumerable
---*)
