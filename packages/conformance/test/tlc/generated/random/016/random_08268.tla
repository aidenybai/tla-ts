(*---
description: Evaluates a random seq expression, seed 262, number 8268.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08268 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<LET b12802 == ([a |-> 1, b |-> TRUE]).a IN Len(<<1, 2>>), (CHOOSE f \in [{1} -> {1}] : TRUE)>> \o SubSeq([SelectSeq(<<1, 2>>, LAMBDA e : e > 0) EXCEPT ![1] = (7 - 1)], CASE (7 < 7) -> IF FALSE THEN 2 ELSE 3 [] OTHER -> (<<5, 6>> @@ <<5, 6>>), (-(<<5, 6>>)[3]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08268 failed.
    Attempted to access index 3 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
