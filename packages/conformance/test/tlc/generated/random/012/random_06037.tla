(*---
description: Evaluates a random set expression, seed 262, number 6037.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06037 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({LET b9299 == LET b9300 == (b9298 \div b9298) IN (b9298 * -1) IN (CASE TRUE -> 3 [] OTHER -> 3 - Cardinality({x \in 1..3 : x > 1})) : b9298 \in {CASE (~TRUE) -> CASE FALSE -> 3 [] OTHER -> 2147483647 [] OTHER -> (-1 % 1), Head(SortSeq(<<>>, LAMBDA p, q : p < q))}})
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 72 to line 14, col 72 of module random_06037 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 66.
    | Expression starting at line 14, column 66.
    | ExtendableExpr starting at line 14, column 65.
    | Expression starting at line 14, column 65.
    | Case Other Arm starting at line 14, column 30.
    | Fatal errors while parsing TLA+ spec in file random_06037
    | In module random_06037
    | Could not parse module random_06037 from file random_06037.tla
    | *** Errors: 1
    | In module random_06037
    | Could not parse module random_06037 from file random_06037.tla
    3002:1 Parsing or semantic analysis failed.
---*)
