(*---
description: Evaluates a random function expression, seed 262, number 8307.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08307 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[(7 :> 0) EXCEPT ![(-1)] = (3 \div 7)] EXCEPT ![(CHOOSE b12855 \in UNION {SUBSET {1}, Nat} : ([a |-> 1] = [a |-> 1, b |-> TRUE]))] = ((2147483647 % 3) * ((1 :> 2))[0])] EXCEPT ![((Head(<<1, 2>>) :> (CHOOSE b12856 \in 1..3 : FALSE)))[((1..3 \cup 1..3) \cap (Nat \cup SUBSET {1}))]] = Len(Append([<<>> EXCEPT ![1] = 3], (7 + 2147483647)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 20 to line 14, col 25 of module random_08307
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08307 failed.
    Attempted to compare overridden value Nat with non-overridden value:
    {{}, {1}}
---*)
