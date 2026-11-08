(*---
description: Evaluates a random int expression, seed 262, number 4427.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04427 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((Head(<<3, 1, 2>>) :> LET b6964 == 2147483647 IN b6964) * Len([<<3, 1, 2>> EXCEPT ![1] = 3])) % CASE (\E b6965 \in (SUBSET {1} \cap SUBSET {1}) : (\E b6966 \in {1} : TRUE)) -> Head(SortSeq(<<1>>, LAMBDA p, q : p < q)) [] OTHER -> ((<<5, 6>> @@ <<5, 6>>))[CASE <<>> -> 3 [] OTHER -> 2]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04427 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
---*)
