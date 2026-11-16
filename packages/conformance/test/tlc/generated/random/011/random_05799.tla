(*---
description: Evaluates a random seq expression, seed 262, number 5799.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05799 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq((<<(3 + 0), (7 + -1)>> \o <<LET b8944 == 3 IN b8944, (2147483647 % 7)>>), IF UNION {(3 .. 1), {-1, 1}} THEN ((2147483647 \div 7) % (-2)) ELSE ((-1) \div ([a |-> 1, b |-> TRUE]).a), ([b8945 \in DOMAIN <<5, 6>> |-> ({} = {2, 1, 3})])[((-1 % 2147483647) + (1 \div 1))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05799 failed.
    A non-boolean expression (a set of the form UNION  S) was used as the condition of an IF.
    line 14, col 97 to line 14, col 201 of module random_05799
---*)
