(*---
description: Evaluates a random int expression, seed 262, number 3191.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03191 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((Cardinality(2..1) \div (0 - 2147483647)) :> Cardinality(UNION {{1, 2}, Nat})))[((Cardinality({2, 1, 3}) * CASE 7 -> FALSE [] OTHER -> 2) + SubSeq((FALSE \o <<1, 2>>), (-1 * -1), Head(<<1>>)))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 190 to line 14, col 190 of module random_03191 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 188.
    | Expression starting at line 14, column 187.
    | ExtendableExpr starting at line 14, column 186.
    | Expression starting at line 14, column 186.
    | Optional Arguments starting at line 14, column 164.
    | Fatal errors while parsing TLA+ spec in file random_03191
    | In module random_03191
    | Could not parse module random_03191 from file random_03191.tla
    | *** Errors: 1
    | In module random_03191
    | Could not parse module random_03191 from file random_03191.tla
    3002:1 Parsing or semantic analysis failed.
---*)
