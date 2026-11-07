(*---
description: Evaluates a random set expression, seed 262, number 3779.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03779 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((({b5965 \in Nat : FALSE} \cap ({1, 2} \cap Nat)) \cup ({b5966 \in {} : TRUE} \cup (2..1 \cap {2, 1, 3}))) \cap (((7 * 2147483647) % (-1 + 2)) .. Append(SelectSeq(7, LAMBDA e : e > 0), Append(<<1, 2>>, 2147483647)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 7*2147483647
    2178:0 Overflow when computing 7*2147483647
---*)
