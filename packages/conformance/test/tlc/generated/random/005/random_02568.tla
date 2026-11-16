(*---
description: Evaluates a random seq expression, seed 262, number 2568.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02568 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq((Append(SelectSeq(<<1, 2>>, LAMBDA e : e > 0), CASE TRUE -> [a |-> 1, b |-> TRUE] [] OTHER -> -1) \o Append((<<3, 1, 2>> \o <<3, 1, 2>>), (-1 + 1))), (-((CHOOSE b4044 \in Nat : TRUE) % [b4045 \in SUBSET {1} |-> b4045])), ((Cardinality(2..1) \div (7 + 7)) + IF (<<3, 1, 2>> = <<>>) THEN Head(<<1>>) ELSE (0 + 0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02568 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 177 to line 14, col 203 of module random_02568
---*)
