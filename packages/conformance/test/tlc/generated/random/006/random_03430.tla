(*---
description: Evaluates a random seq expression, seed 262, number 3430.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03430 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SubSeq(SelectSeq([<<1>> EXCEPT ![1] = 7], LAMBDA e : e > 0), (Cardinality(2..1) + (3 \div 7)), ((2147483647 % 3) \div (TRUE <=> SUBSET {1}))), (((3 - 2147483647) - (7 * -1)) \div IF {b5438 \in {} : TRUE} THEN (2147483647 \div 1) ELSE (--1))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 190 to line 14, col 190 of module random_03430 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 188.
    | Expression starting at line 14, column 188.
    | ExtendableExpr starting at line 14, column 187.
    | ExtendableExpr starting at line 14, column 168.
    | Expression starting at line 14, column 168.
    | Fatal errors while parsing TLA+ spec in file random_03430
    | In module random_03430
    | Could not parse module random_03430 from file random_03430.tla
    | *** Errors: 1
    | In module random_03430
    | Could not parse module random_03430 from file random_03430.tla
    3002:1 Parsing or semantic analysis failed.
---*)
