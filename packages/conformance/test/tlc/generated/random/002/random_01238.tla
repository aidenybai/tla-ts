(*---
description: Evaluates a random bool expression, seed 262, number 1238.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01238 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b1983 \in UNION {{CASE FALSE -> 1 [] OTHER -> b1984 : b1984 \in (0 \in {})}, ({b1985 \in Nat : TRUE} \cup {7 : b1986 \in {2, 1, 3}})} : (([[a |-> 1, b |-> TRUE] EXCEPT !.a = b1983] = [a |-> b1983, b |-> TRUE]) \/ Append(Tail(<<>>), (b1983 % -1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01238 failed.
    TLC encountered a non-enumerable quantifier bound
    FALSE.
    line 14, col 85 to line 14, col 92 of module random_01238
---*)
