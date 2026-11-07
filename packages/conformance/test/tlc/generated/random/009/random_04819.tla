(*---
description: Evaluates a random set expression, seed 262, number 4819.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04819 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({IF ((TRUE <=> TRUE) <=> (b7518 = b7518)) THEN ((CHOOSE f \in [{} -> {2, 1, 3}] : TRUE))[(CHOOSE b7519 \in SUBSET {1} : TRUE)] ELSE ([b7520 \in {1} |-> 2147483647])[([a |-> 1, b |-> TRUE]).a] : b7518 \in ((Head(<<1>>) + (-1 % 2)) .. ((-1 \div 2147483647) + (-2)))})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
