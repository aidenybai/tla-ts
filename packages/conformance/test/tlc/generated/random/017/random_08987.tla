(*---
description: Evaluates a random set expression, seed 262, number 8987.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08987 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({LET b13953 == CASE (\A b13954 \in 2..1 : TRUE) -> (b13952 \div 2) [] OTHER -> ([a |-> 1, b |-> TRUE]).a IN Head(SubSeq(<<1>>, Nat, 7)) : b13952 \in DOMAIN [[b13955 \in SUBSET {1} |-> 0] EXCEPT ![LET b13956 == FALSE IN b13956] = CASE TRUE -> 7 [] OTHER -> 7]})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08987 failed.
    Attempted to check if the non-enumerable value
    FALSE
    is element of
    {{}, {1}}
---*)
