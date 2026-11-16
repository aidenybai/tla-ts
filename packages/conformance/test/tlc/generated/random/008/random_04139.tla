(*---
description: Evaluates a random int expression, seed 262, number 4139.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04139 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b6518 == Cardinality(UNION {SUBSET {1}, {}}) IN ((-b6518) + CASE TRUE -> b6518 [] OTHER -> 0) + (Head(([x \in Nat |-> x + 1] \o <<1, 2>>)) % ((CHOOSE b6519 \in {2, 1, 3} : FALSE) - (0 \div -1)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 205 to line 14, col 208 of module random_04139 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 203.
    | Expression starting at line 14, column 203.
    | ExtendableExpr starting at line 14, column 202.
    | ExtendableExpr starting at line 14, column 163.
    | Expression starting at line 14, column 163.
    | Fatal errors while parsing TLA+ spec in file random_04139
    | In module random_04139
    | Could not parse module random_04139 from file random_04139.tla
    | *** Errors: 1
    | In module random_04139
    | Could not parse module random_04139 from file random_04139.tla
    3002:1 Parsing or semantic analysis failed.
---*)
