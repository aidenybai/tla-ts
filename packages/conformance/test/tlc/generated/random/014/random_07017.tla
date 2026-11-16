(*---
description: Evaluates a random set expression, seed 262, number 7017.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07017 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({IF (\E b10764 \in {7, 0} : ([a |-> 1]).a) THEN (([a |-> 1] - 0) % (CHOOSE b10765 \in {1} : FALSE)) ELSE (-(-1 \div -1)) : b10763 \in SubSeq(SortSeq((<<3, 1, 2>> \o <<1, 2>>), LAMBDA p, q : p < q), ((7 - -1) \div (CHOOSE b10766 \in {1} : FALSE)), Cardinality((SUBSET {1} \cup {})))})
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 127 to line 14, col 130 of module random_07017 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 125.
    | Expression starting at line 14, column 124.
    | ExtendableExpr starting at line 14, column 123.
    | Expression starting at line 14, column 122.
    | ExtendableExpr starting at line 14, column 121.
    | Fatal errors while parsing TLA+ spec in file random_07017
    | In module random_07017
    | Could not parse module random_07017 from file random_07017.tla
    | *** Errors: 1
    | In module random_07017
    | Could not parse module random_07017 from file random_07017.tla
    3002:1 Parsing or semantic analysis failed.
---*)
