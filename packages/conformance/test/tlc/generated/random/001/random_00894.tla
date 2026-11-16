(*---
description: Evaluates a random record expression, seed 262, number 894.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00894 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[[a |-> 1] EXCEPT !.a = -1] EXCEPT !.a = (2147483647 * -1)] EXCEPT !.a = @ + (LET b1443 == 2147483647 IN [a |-> 1, b |-> TRUE] * Cardinality({}))] EXCEPT !.a = CASE ((0 + 7) < SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q)) -> Cardinality(({1} \cap SUBSET {1})) [] OTHER -> IF (2147483647 \in {1, 2}) THEN Head(<<>>) ELSE LET b1444 == -1 IN 3])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 72 to line 14, col 72 of module random_00894 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 61.
    | Expression starting at line 14, column 61.
    | ExtendableExpr starting at line 14, column 60.
    | Expression starting at line 14, column 60.
    | Except Spec starting at line 14, column 54.
    | Fatal errors while parsing TLA+ spec in file random_00894
    | In module random_00894
    | Could not parse module random_00894 from file random_00894.tla
    | *** Errors: 1
    | In module random_00894
    | Could not parse module random_00894 from file random_00894.tla
    3002:1 Parsing or semantic analysis failed.
---*)
