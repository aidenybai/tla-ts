(*---
description: Evaluates a random bool expression, seed 262, number 4451.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04451 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b7004 \in (({b7005 \in {} : FALSE} \ {<<1>> : b7006 \in SUBSET {1}}) \ {Head(<<1>>), (1 % 2147483647)}) : (({b7007 : b7007 \in 1..3} \ ({} \cup SUBSET {1})) = DOMAIN [b7008 \in SUBSET {1} |-> b7004])))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
