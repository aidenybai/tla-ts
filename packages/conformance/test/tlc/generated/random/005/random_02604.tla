(*---
description: Evaluates a random set expression, seed 262, number 2604.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02604 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2147483647]).a : b4102 \in (UNION {{1}, 2..1} \cap {<<1, 2>> : b4103 \in {1, 2}})} \cap {((1 % 2147483647) \div IF FALSE THEN <<5, 6>> ELSE 2147483647), (Head(<<1, 2>>) * (--1))}))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 233 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 230.
    | ExtendableExpr starting at line 14, column 213.
    | Expression starting at line 14, column 213.
    | ExtendableExpr starting at line 14, column 212.
    | Expression starting at line 14, column 212.
    | Fatal errors while parsing TLA+ spec in file random_02604
    | In module random_02604
    | Could not parse module random_02604 from file random_02604.tla
    | *** Errors: 1
    | In module random_02604
    | Could not parse module random_02604 from file random_02604.tla
    3002:1 Parsing or semantic analysis failed.
---*)
