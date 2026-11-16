(*---
description: Evaluates a random set expression, seed 262, number 4310.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04310 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b6792 \in ({IF FALSE THEN 0 ELSE -1, LET b6793 == 2147483647 IN b6793} \cap (UNION {{}, {}} \cap DOMAIN <<5, 6>>)) : (LET b6794 == (0 - b6792) IN LET b6795 == b6794 IN 2 \in (([x \in Nat |-> x + 1])[b6792] .. (TRUE % 1)))})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
