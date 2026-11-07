(*---
description: Evaluates a random record expression, seed 262, number 5632.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05632 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (IF ([a |-> 1] \/ TRUE) THEN Cardinality(SUBSET {1}) ELSE IF -1 THEN Nat ELSE 0 + (LET b8703 == 3 IN 1 \div CASE 2..1 -> -1 [] OTHER -> 0)), b |-> (Head(SortSeq(<<1>>, LAMBDA p, q : p < q)) \in {b8704 \in {b8705 \in SUBSET {1} : FALSE} : (\A b8706 \in {1, 2} : FALSE)})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05632 failed.
    Attempted to evaluate an expression of form P \/ Q when P was
    a record.
    line 14, col 28 to line 14, col 44 of module random_05632
---*)
