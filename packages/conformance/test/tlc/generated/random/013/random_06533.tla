(*---
description: Evaluates a random int expression, seed 262, number 6533.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06533 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE ({Len(<<1>>), (-3)} = {b10039 \in {b10040 : b10040 \in {x \in 1..3 : x > 1}} : ({2, 1, 3} \subseteq {2, 1, 3})}) -> LET b10041 == ((1 - -1) - (CHOOSE b10042 \in SUBSET {1} : TRUE)) IN (LET b10043 == 7 IN b10041 + (2147483647 \div b10041)) [] OTHER -> Cardinality({Tail(<<1, 2>>), Len(<<3, 1, 2>>)}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06533 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare integer 3 with non-integer:
    <<2>>
---*)
