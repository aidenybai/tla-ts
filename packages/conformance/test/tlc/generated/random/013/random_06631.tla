(*---
description: Evaluates a random seq expression, seed 262, number 6631.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06631 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(([Append(<<1, 2>>, 7) EXCEPT ![1] = IF TRUE THEN {2, 1, 3} ELSE 0] \o <<(2147483647 + 1), (CHOOSE b10184 \in Nat : TRUE)>>), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647+1
    2178:0 Overflow when computing 2147483647+1
---*)
