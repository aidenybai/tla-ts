(*---
description: Evaluates a random int expression, seed 262, number 3134.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03134 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE (\E b5008 \in ({b5009 \in {1} : TRUE} \cup (2 .. 7)) : (\E b5010 \in (2..1 \cap {}) : (<<1, 2>> = (1 :> 2)))) -> (CASE (\A b5011 \in SUBSET {1} : TRUE) -> LET b5012 == 7 IN 3 [] OTHER -> ([a |-> 1]).a + Cardinality({1 : b5013 \in 2..1})) [] OTHER -> (\A b5014 \in UNION {DOMAIN <<5, 6>>, {2147483647 : b5015 \in 1..3}} : ((~TRUE) /\ (FALSE <=> TRUE))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
