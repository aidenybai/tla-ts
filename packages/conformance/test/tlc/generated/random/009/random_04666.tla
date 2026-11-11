(*---
description: Evaluates a random seq expression, seed 262, number 4666.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04666 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(SortSeq(<<(-1), (3 % 0)>>, LAMBDA p, q : p < q), LET b7291 == ((2147483647 * -1) \div [<<1>> EXCEPT ![1] = 1]) IN Head(Tail(<<1, 2>>)), ((([a |-> 1, b |-> TRUE]).a * Cardinality(SUBSET {1})) \div CASE (2 = 2) -> Cardinality({}) [] OTHER -> Len(<<3, 1, 2>>))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 98 to line 14, col 98 of module random_04666 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 87.
    | Expression starting at line 14, column 87.
    | ExtendableExpr starting at line 14, column 86.
    | Expression starting at line 14, column 86.
    | ExtendableExpr starting at line 14, column 85.
    | Fatal errors while parsing TLA+ spec in file random_04666
    | In module random_04666
    | Could not parse module random_04666 from file random_04666.tla
    | *** Errors: 1
    | In module random_04666
    | Could not parse module random_04666 from file random_04666.tla
    3002:1 Parsing or semantic analysis failed.
---*)
