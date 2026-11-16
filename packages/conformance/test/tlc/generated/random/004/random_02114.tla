(*---
description: Evaluates a random set expression, seed 262, number 2114.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02114 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF ((\E b3356 \in 2..1 : FALSE) \/ ({x \in 1..3 : x > 1} \in 1..3)) THEN (CASE FALSE -> 2 [] OTHER -> 1 + (7 \div -1)) ELSE (((1 :> 2))[2147483647] % (CHOOSE b3357 \in {2, 1, 3} : TRUE)) .. Len(SortSeq(SubSeq(<<1, 2>>, 1, 7), LAMBDA p, q : p < q))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 126 to line 14, col 129 of module random_02114 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 124.
    | Expression starting at line 14, column 124.
    | ExtendableExpr starting at line 14, column 123.
    | ExtendableExpr starting at line 14, column 119.
    | Expression starting at line 14, column 119.
    | Fatal errors while parsing TLA+ spec in file random_02114
    | In module random_02114
    | Could not parse module random_02114 from file random_02114.tla
    | *** Errors: 1
    | In module random_02114
    | Could not parse module random_02114 from file random_02114.tla
    3002:1 Parsing or semantic analysis failed.
---*)
