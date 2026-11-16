(*---
description: Evaluates a random int expression, seed 262, number 6350.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06350 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b9751 \in {b9752 \in UNION {(<<5, 6>> \cup SUBSET {1}), UNION {2..1, 2..1}} : ((FALSE => FALSE) <=> (\A b9753 \in SUBSET {1} : FALSE))} : (LET b9754 == [b9755 \in {2, 1, 3} |-> b9755] IN (b9751 \div 7) = (-LET b9756 == b9751 IN b9756))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06350 failed.
    Attempted to enumerate S \cup T when S:
    <<5, 6>>
    and T:
    {{}, {1}}
    are not both enumerable
---*)
