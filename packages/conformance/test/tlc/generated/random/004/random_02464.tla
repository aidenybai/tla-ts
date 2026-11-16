(*---
description: Evaluates a random bool expression, seed 262, number 2464.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02464 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([<<([a |-> 1, b |-> TRUE]).a, (<<5, 6>>)[-1]>> EXCEPT ![1] = (CASE TRUE -> 1 [] OTHER -> 3 % (2 - 1))] = [[{b3882 \in {2, 1, 3} : TRUE} EXCEPT ![Len(<<1, 2>>)] = LET b3883 == 2147483647 IN 7] EXCEPT ![((<<5, 6>>)[3] % (-0))] = (Cardinality(Nat) % Len(<<3, 1, 2>>))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02464 failed.
    Attempted to access index -1 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
