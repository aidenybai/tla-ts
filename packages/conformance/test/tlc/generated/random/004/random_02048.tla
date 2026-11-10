(*---
description: Evaluates a random bool expression, seed 262, number 2048.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02048 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((SubSeq(<<>>, 1, -1) \o SortSeq([x \in Nat |-> x + 1], LAMBDA p, q : p < q)) \o Append(Append(<<1, 2>>, 0), LET b3255 == 1 IN b3255)) = [[b3256 \in UNION {2..1, {x \in 1..3 : x > 1}} |-> (7 - b3256)] EXCEPT ![LET b3257 == (--1) IN (b3257 + 2)] = ((0 \div 2147483647) - (7 + 0))]))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 243 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 240.
    | Expression starting at line 14, column 240.
    | Definition starting at line 14, column 231.
    | Let Definitions starting at line 14, column 231.
    | Case Other Arm starting at line 14, column 227.
    | Fatal errors while parsing TLA+ spec in file random_02048
    | In module random_02048
    | Could not parse module random_02048 from file random_02048.tla
    | *** Errors: 1
    | In module random_02048
    | Could not parse module random_02048 from file random_02048.tla
    3002:1 Parsing or semantic analysis failed.
---*)
