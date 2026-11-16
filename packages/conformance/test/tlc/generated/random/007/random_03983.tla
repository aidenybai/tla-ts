(*---
description: Evaluates a random record expression, seed 262, number 3983.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03983 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (Len(Append(<<1>>, 1)) \div (LET b6264 == -1 IN b6264 * LET b6265 == 2 IN -1)), b |-> (\A b6266 \in ((-0) .. Len(<<1, 2>>)) : (\A b6267 \in {b6268 : b6268 \in 2..1} : (<<>> = [x \in Nat |-> x + 1])))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 2, b |-> TRUE]"
---*)
