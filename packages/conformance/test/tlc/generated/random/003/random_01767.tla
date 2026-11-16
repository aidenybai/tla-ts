(*---
description: Evaluates a random set expression, seed 262, number 1767.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01767 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(((CHOOSE b2807 \in {} : TRUE) % Tail(<<3, 1, 2>>)) + ((CHOOSE b2808 \in {x \in 1..3 : x > 1} : TRUE) \div Head(<<1, 2>>))) : b2806 \in (UNION {({} \cap {2, 1, 3}), (7 .. 2)} \cap {IF TRUE THEN 2 ELSE -1, (0 + 0)})})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
