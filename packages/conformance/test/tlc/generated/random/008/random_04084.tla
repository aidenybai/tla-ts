(*---
description: Evaluates a random function expression, seed 262, number 4084.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04084 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE (\E b6420 \in (1..3 \cap {x \in 1..3 : x > 1}) : (SUBSET {1} = {2, 1, 3})) -> ((CHOOSE f \in [{1, 2} \cap {2} -> {1, 2}] : TRUE))[(3 % 1)] [] OTHER -> IF ([a |-> 1] = [a |-> 1]) THEN (0 * 1) ELSE CASE FALSE -> 3 [] OTHER -> 7 \div Head((Append({}, 7) \o Append(<<>>, 2)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
