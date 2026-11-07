(*---
description: Evaluates a random seq expression, seed 262, number 2091.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02091 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SortSeq(Append(<<-1, 2147483647>>, (7 - 1)), LAMBDA p, q : p < q), (((2147483647 * 1) - (-1 - 2147483647)) % CASE (FALSE <=> FALSE) -> Cardinality(Nat) [] OTHER -> (0 - -1))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647--2147483648
    2178:0 Overflow when computing 2147483647--2147483648
---*)
