(*---
description: Evaluates a random seq expression, seed 262, number 5770.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05770 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE (~((3 % 2147483647) \in UNION {{1, 2}, Nat})) -> Append(SubSeq(Append(<<3, 1, 2>>, -1), Cardinality({1}), (CHOOSE b8890 \in 2..1 : TRUE)), (-[[a |-> 1] EXCEPT !.a = 3])) [] OTHER -> Head([SubSeq(<<>>, 0, -1) EXCEPT ![1] = (<<5, 6>>)[3]]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05770 failed.
    Attempted to compare overridden value Nat with non-overridden value:
    {1, 2}
---*)
