(*---
description: Evaluates a random seq expression, seed 262, number 9729.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09729 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<((-7) % <<1, 2>>), LET b15099 == Head(<<1>>) IN IF FALSE THEN b15099 ELSE b15099>> \o SubSeq(SelectSeq(Append(<<1>>, 0), LAMBDA e : e > 0), (CHOOSE b15100 \in {b15101 : b15101 \in {1, 2}} : (FALSE \/ FALSE)), (CHOOSE b15102 \in DOMAIN <<5, 6>> : (3 = b15102)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
